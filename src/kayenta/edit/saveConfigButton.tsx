import { CanarySettings } from 'kayenta/canary.settings';
import * as React from 'react';
import { connect } from 'react-redux';

import { SubmitButton } from '@spinnaker/core';

import * as Creators from '../actions/creators';
import { ICanaryState } from '../reducers';
import { AsyncRequestState } from '../reducers/asyncRequest';

interface ISaveButtonStateProps {
  saveConfigState: AsyncRequestState;
  inSyncWithServer: boolean;
  disable: boolean;
}

interface ISaveButtonDispatchProps {
  saveConfig: () => void;
}

/*
 * Button for saving a canary config.
 */
function SaveConfigButton({
  saveConfigState,
  inSyncWithServer,
  saveConfig,
  disable,
}: ISaveButtonStateProps & ISaveButtonDispatchProps) {
  if (inSyncWithServer && saveConfigState !== AsyncRequestState.Requesting) {
    return (
      <span className="btn btn-link disabled">
        <i className="far fa-check-circle" /> In sync with server
      </span>
    );
  } else {
    return (
      <SubmitButton
        label="Save Changes"
        onClick={saveConfig}
        isDisabled={disable || CanarySettings.disableConfigEdit}
        submitting={saveConfigState === AsyncRequestState.Requesting}
      />
    );
  }
}

function mapStateToProps(state: ICanaryState): ISaveButtonStateProps {
  const disable = !!state.selectedConfig.validationErrors.length || CanarySettings.disableConfigEdit;
  return {
    saveConfigState: state.selectedConfig.save.state,
    inSyncWithServer: state.selectedConfig.isInSyncWithServer,
    disable,
  };
}

function mapDispatchToProps(dispatch: any): ISaveButtonDispatchProps {
  return {
    saveConfig: () => {
      dispatch(Creators.saveConfig());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SaveConfigButton);
