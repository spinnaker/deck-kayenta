import * as React from 'react';
import { connect } from 'react-redux';

import { ICanaryState } from '../reducers/index';
import { ICanaryConfig } from '../domain/ICanaryConfig';
import ConfigDetailActionButtons from './configDetailActionButtons';

interface IConfigDetailStateProps {
  selectedConfig: ICanaryConfig;
}

/*
 * Config detail header layout.
 */
function ConfigDetailHeader({ selectedConfig }: IConfigDetailStateProps) {
  return (
    <div className="row">
      <div className="col-sm-6">
        <h2>{selectedConfig.name}</h2>
      </div>
      <div className="col-sm-3">
        {/* TODO: config metadata goes here. */}
      </div>
      <div className="col-sm-3">
        <ConfigDetailActionButtons/>
      </div>
    </div>
  );
}

function mapStateToProps(state: ICanaryState): IConfigDetailStateProps {
  return {
    selectedConfig: state.selectedConfig
  };
}

export default connect(mapStateToProps)(ConfigDetailHeader);
