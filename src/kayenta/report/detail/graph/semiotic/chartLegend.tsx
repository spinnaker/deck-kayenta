///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';

import { vizConfig } from './config';
import './chartLegend.less';

export default () => {
  const baselineIconStyle = {
    backgroundColor: vizConfig.colors.baseline,
  };

  const canaryIconStyle = {
    backgroundColor: vizConfig.colors.canary,
  };

  return (
    <div className={'semiotic-legend'}>
      <div className={'legend-item'}>
        <div className={'legend-icon'} style={baselineIconStyle} />
        <div>{'Baseline'}</div>
      </div>
      <div className={'legend-item'}>
        <div className={'legend-icon'} style={canaryIconStyle} />
        <div>{'Canary'}</div>
      </div>
    </div>
  );
};
