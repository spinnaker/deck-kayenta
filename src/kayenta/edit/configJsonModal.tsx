import * as React from 'react';
import { Action } from 'redux';
import { connect } from 'react-redux';
import { Modal } from 'react-bootstrap';
import { get, omit } from 'lodash';

import { JsonUtils, NgReact, IJsonDiff } from '@spinnaker/core';
import * as Creators from 'kayenta/actions/creators';
import { ICanaryState } from 'kayenta/reducers';
import { mapStateToConfig } from 'kayenta/service/canaryConfig.service';
import Styleguide from 'kayenta/layout/styleguide';
import { Tab, Tabs } from 'kayenta/layout/tabs';
import { DisableableTextarea, DISABLE_EDIT_CONFIG } from 'kayenta/layout/disableable';

const { DiffView } = NgReact;

import './configJson.less';

interface IConfigJsonDispatchProps {
  closeModal: () => void;
  setConfigJson: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  updateConfig: (event: any) => void;
  setTabState: (state: ConfigJsonModalTabState) => () => void;
}

interface IConfigJsonStateProps {
  show: boolean;
  configJson: string;
  id: string;
  deserializationError: string;
  tabState: ConfigJsonModalTabState;
  diff: IJsonDiff;
}

export enum ConfigJsonModalTabState {
  Edit,
  Diff,
}

/*
 * Modal for viewing canary config JSON.
 */
function ConfigJsonModal({ show, configJson, id, deserializationError, closeModal, setConfigJson, updateConfig, setTabState, tabState, diff }: IConfigJsonDispatchProps & IConfigJsonStateProps) {
  return (
    <Modal show={show} onHide={onHide} bsSize="large">
      <Styleguide>
        <Modal.Header>
          <Modal.Title>JSON</Modal.Title>
        </Modal.Header>
          <Modal.Body>
            <section>
              <Tabs>
                <Tab selected={tabState === ConfigJsonModalTabState.Edit}>
                  <a onClick={setTabState(ConfigJsonModalTabState.Edit)}>Edit</a>
                </Tab>
                <Tab selected={tabState === ConfigJsonModalTabState.Diff}>
                  <a onClick={setTabState(ConfigJsonModalTabState.Diff)}>Diff</a>
                </Tab>
              </Tabs>
            </section>
            <section className="kayenta-config-json">
              {tabState === ConfigJsonModalTabState.Edit && (
                <DisableableTextarea
                  rows={configJson.split('\n').length}
                  className="form-control code flex-fill"
                  spellCheck={false}
                  value={configJson}
                  onChange={setConfigJson}
                  disabledStateKeys={[DISABLE_EDIT_CONFIG]}
                />
              )}
              {tabState === ConfigJsonModalTabState.Diff && !deserializationError && (
                <div className="modal-show-history">
                  <div className="show-history">
                    <DiffView diff={diff}/>
                  </div>
                </div>
              )}
              {!!deserializationError && (
                <div className="horizontal row center">
                  <span className="error-message">Error: {deserializationError}</span>
                </div>
              )}
            </section>
          </Modal.Body>
        <Modal.Footer>
          <ul className="list-inline pull-right">
            <li>
              <button className="passive" onClick={closeModal}>Close</button>
            </li>
            <li>
              <button
                className="primary"
                data-id={id}
                data-serialized={configJson}
                onClick={updateConfig}
                disabled={!!deserializationError}
              >Update
              </button>
            </li>
          </ul>
        </Modal.Footer>
      </Styleguide>
    </Modal>
  );
}

function mapDispatchToProps(dispatch: (action: Action & any) => void): IConfigJsonDispatchProps {
  return {
    closeModal: () => dispatch(Creators.closeConfigJsonModal()),
    setTabState: (state: ConfigJsonModalTabState) => () => dispatch(Creators.setConfigJsonModalTabState({ state })),
    setConfigJson: (event: React.ChangeEvent<HTMLTextAreaElement>) => dispatch(Creators.setConfigJson({ json: event.target.value })),
    updateConfig: (event: any) => {
      dispatch(Creators.selectConfig({
        config: {
          id: event.target.dataset.id,
          ...JSON.parse(event.target.dataset.serialized)
        },
      }));
    }
  };
}

function mapStateToProps(state: ICanaryState): IConfigJsonStateProps {
  const id: string = get(state, 'selectedConfig.config.id');
  const persistedConfig = JsonUtils.makeSortedStringFromObject(
    omit(state.data.configs.find(c => c.id === id) || {}, 'id'),
  );

  const configJson = state.selectedConfig.json.configJson
    || JsonUtils.makeSortedStringFromObject(omit(mapStateToConfig(state) || {}, 'id'));

  return {
    configJson,
    id,
    show: state.app.configJsonModalOpen,
    deserializationError: state.selectedConfig.json.error,
    tabState: state.app.configJsonModalTabState,
    diff: state.selectedConfig.json.error ? null : JsonUtils.diff(persistedConfig, configJson, true),
  };
}

const onHide = (): void => null;

export default connect(mapStateToProps, mapDispatchToProps)(ConfigJsonModal);
