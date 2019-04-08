///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { scaleUtc } from 'd3-scale';
// // import { extent } from 'd3-array';
import { XYFrame } from 'semiotic';
import * as moment from 'moment-timezone';
import { SETTINGS } from '@spinnaker/core';
const { defaultTimeZone } = SETTINGS;
import { curveStepAfter } from 'd3-shape';
// import { IMetricSetScope } from 'kayenta/domain/IMetricSetPair';
import { IMetricSetPair } from 'kayenta/domain/IMetricSetPair';
//
import * as utils from './utils';
// import Tooltip from './tooltip';
// import ChartHeader from './chartHeader';
// import ChartLegend from './chartLegend';
import { ISemioticChartProps, IMargin } from './semiotic.service';
// import './graph.less';
import { vizConfig } from './config';
import './differenceArea.less';
// import CircleIcon from './circleIcon';

moment.tz.setDefault(defaultTimeZone);

interface IDataPoint {
  timestampMillis: number;
  value: number;
}

interface IChartDataSet {
  color: string;
  coordinates: IDataPoint[];
}

interface IDifferenceAreaProps extends ISemioticChartProps {
  height: number;
}

export default class DifferenceArea extends React.Component<IDifferenceAreaProps> {
  private margin: IMargin = {
    top: 0,
    bottom: 24,
    left: 60,
    right: 20,
  };

  formatDifferenceTSData = (metricSetPair: IMetricSetPair) => {
    const {
      values: { experiment, control },
      scopes,
    } = metricSetPair;
    console.log(metricSetPair);
    const stepMillis = scopes.control.stepMillis;
    let dataPoints = control.map((c, i) => {
      let e = experiment[i];
      return {
        timestampMillis: scopes.control.startTimeMillis + i * stepMillis,
        value: typeof c !== 'number' || typeof e !== 'number' ? 0 : e - c,
      };
    });

    return dataPoints;
  };

  public render() {
    console.log('Diff bar...');
    console.log(this.props);
    // const { metricSetPair, config, parentWidth } = this.props;
    const { metricSetPair, parentWidth, height } = this.props;
    // const { userBrushExtent } = this.state;

    const chartData = this.formatDifferenceTSData(metricSetPair);
    console.log(chartData);

    const lineStyleFunc = (ds: IChartDataSet) => {
      return {
        fill: ds.color,
        fillOpacity: 0.8,
      };
    };

    const axes = [
      {
        orient: 'left',
        tickFormat: (d: number) => {
          return utils.formatMetricValue(d);
        },
      },
      {
        orient: 'bottom',
        ticks: 8,
        tickFormat: (d: number) => {
          return moment(d).format('h:mma');
        },
      },
    ];

    const computedConfig = {
      lines: [{ coordinates: chartData, color: vizConfig.colors.canary }],
      size: [parentWidth, height],
      margin: this.margin,
      lineType: {
        type: 'area',
        interpolator: curveStepAfter,
      },
      lineStyle: lineStyleFunc,
      xAccessor: (d: IDataPoint) => moment(d.timestampMillis).toDate(),
      yAccessor: 'value',
      xScaleType: scaleUtc(),
      axes: axes,
    };

    return (
      <div className={'difference-area'}>
        <div className={'chart-title'}>{'Canary Value Differences from Baseline'}</div>
        <XYFrame {...computedConfig} />
      </div>
    );
  }
}
