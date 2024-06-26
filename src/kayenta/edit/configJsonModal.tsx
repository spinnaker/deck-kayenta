import 'brace/ext/searchbox';
import 'brace/mode/json';
import * as Creators from 'kayenta/actions/creators';
import { CanarySettings } from 'kayenta/canary.settings';
import Styleguide from 'kayenta/layout/styleguide';
import { Tab, Tabs } from 'kayenta/layout/tabs';
import { ICanaryState } from 'kayenta/reducers';
import { mapStateToConfig } from 'kayenta/service/canaryConfig.service';
import { get, omit } from 'lodash';
import * as React from 'react';
import { Modal } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Action } from 'redux';

import { DiffView, IJsonDiff, JsonEditor, JsonUtils } from '@spinnaker/core';

import './configJson.less';

interface IConfigJsonDispatchProps {
  closeModal: () => void;
  setConfigJson: (json: string) => void;
  updateConfig: (event: any) => void;
  setTabState: (state: ConfigJsonModalTabState) => () => void;
}

interface IConfigJsonStateProps {
  show: boolean;
  disabled: boolean;
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
function ConfigJsonModal({
  show,
  disabled,
  configJson,
  id,
  deserializationError,
  closeModal,
  setConfigJson,
  updateConfig,
  setTabState,
  tabState,
  diff,
}: IConfigJsonDispatchProps & IConfigJsonStateProps) {
  return (
    <Modal show={show} onHide={(): void => null} bsSize="large">
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
              <JsonEditor value={configJson} debounceChangePeriod={500} onChange={setConfigJson} readOnly={disabled} />
            )}
            {tabState === ConfigJsonModalTabState.Diff && !deserializationError && (
              <div className="modal-show-history">
                <div className="show-history">
                  <DiffView diff={diff} />
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
              <button className="passive" onClick={closeModal}>
                Close
              </button>
            </li>
            <li>
              <button
                className="primary"
                data-id={id}
                data-serialized={configJson}
                onClick={updateConfig}
                disabled={!!deserializationError || disabled}
              >
                Update
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
    setConfigJson: (json: string) => dispatch(Creators.setConfigJson({ json })),
    updateConfig: (event: any) => {
      dispatch(
        Creators.selectConfig({
          config: {
            id: event.target.dataset.id,
            ...JSON.parse(event.target.dataset.serialized),
          },
        }),
      );
    },
  };
}

function mapStateToProps(state: ICanaryState): IConfigJsonStateProps {
  const id: string = get(state, 'selectedConfig.config.id');
  const persistedConfig = JsonUtils.makeSortedStringFromObject(
    omit(state.data.configs.find((c) => c.id === id) || {}, 'id'),
  );

  const configJson =
    state.selectedConfig.json.configJson ||
    JsonUtils.makeSortedStringFromObject(omit(mapStateToConfig(state) || {}, 'id'));

  const disabled = state.app.disableConfigEdit || CanarySettings.disableConfigEdit;

  return {
    configJson,
    id,
    disabled,
    show: state.app.configJsonModalOpen,
    deserializationError: state.selectedConfig.json.error,
    tabState: state.app.configJsonModalTabState,
    diff: state.selectedConfig.json.error ? null : JsonUtils.diff(persistedConfig, configJson, true),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfigJsonModal);
