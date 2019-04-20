///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { scaleUtc } from 'd3-scale';
import { XYFrame } from 'semiotic';
import * as moment from 'moment-timezone';
import { curveStepAfter } from 'd3-shape';
import * as _ from 'lodash';

import { IMetricSetPair } from 'kayenta/domain/IMetricSetPair';
import { ISemioticChartProps, IMargin } from './semiotic.service';
import { vizConfig } from './config';
import './differenceArea.less';
import * as utils from './utils';
import CustomAxisTickLabel from './customAxisTickLabel';
import SecondaryTSXAxis from './secondaryTSXAxis';

interface IDataPoint {
  timestampMillis: number;
  value: number;
}

interface IChartDataSet {
  label: string;
  color: string;
  coordinates: IDataPoint[];
}

// interface IDifferenceAreaProps extends ISemioticChartProps{
//   height: number;
//   headerHeight: number;
// }

/*
* Supplemental visualization in the time series view to highlight
* Canary difference to baseline at any given timestamp
*/

export default class DifferenceArea extends React.Component<ISemioticChartProps> {
  private margin: IMargin = {
    left: 60,
    right: 20,
  };

  private chartHeight: number = 40; // chart height not including axes height
  private headerHeight: number = 17;

  formatDifferenceTSData = (metricSetPair: IMetricSetPair) => {
    const {
      values: { experiment, control },
      scopes,
    } = metricSetPair;

    const stepMillis = scopes.control.stepMillis;
    let differenceDataPoints: IDataPoint[] = [];
    let baselineReferenceDataPoints: IDataPoint[] = [];
    control.forEach((c, i) => {
      let e = experiment[i];
      let timestampMillis = scopes.control.startTimeMillis + i * stepMillis;
      differenceDataPoints.push({
        timestampMillis,
        value: typeof c !== 'number' || typeof e !== 'number' ? 0 : e - c,
      });
      baselineReferenceDataPoints.push({
        timestampMillis,
        value: 0,
      });
    });

    return [
      {
        label: 'difference',
        color: vizConfig.colors.canary,
        coordinates: differenceDataPoints,
      },
      {
        label: 'baselineReference',
        color: vizConfig.colors.baseline,
        coordinates: baselineReferenceDataPoints,
      },
    ];
  };

  public render() {
    let { metricSetPair, parentWidth } = this.props;

    const { axisTickLineHeight, axisTickLabelHeight, axisLabelHeight } = vizConfig.timeSeries;

    // Test data ====================
    const testOffset = 240000 + 18000000;
    metricSetPair = _.cloneDeep(metricSetPair);
    metricSetPair.scopes.experiment.startTimeMillis = metricSetPair.scopes.experiment.startTimeMillis + testOffset;
    Object.values(metricSetPair.values.experiment).forEach((d: any) => {
      d = d + testOffset;
    });

    const { scopes, values } = metricSetPair;

    /*
    * Generate the data needed for the graph components
    */
    const startTimeMillis = scopes.control.startTimeMillis;
    const millisSet = values.control.map((_, i: number) => {
      return startTimeMillis + i * scopes.control.stepMillis;
    });

    const millisOffset = scopes.experiment.startTimeMillis - scopes.control.startTimeMillis;
    const millisSetCanary = millisOffset === 0 ? millisSet : millisSet.map((ms: number) => ms + millisOffset);
    const chartData = this.formatDifferenceTSData(metricSetPair);
    const shouldUseSecondaryXAxis = millisOffset !== 0;

    /*
    * Build the visualization components
    */
    const lineStyleFunc = (ds: IChartDataSet) => {
      return ds.label === 'difference'
        ? {
            fill: ds.color,
            fillOpacity: 0.6,
          }
        : {
            stroke: ds.color,
            strokeOpacity: 1,
            strokeWidth: 2,
            strokeDasharray: 5,
          };
    };

    const axes = [
      {
        orient: 'left',
        tickFormat: () => `\u0394 = 0`,
        tickValues: [0],
      },
      {
        orient: 'bottom',
        tickValues: utils.calculateDateTimeTicks(millisSet),
        tickFormat: (d: number) => <CustomAxisTickLabel millis={d} />,
        label: shouldUseSecondaryXAxis ? 'Baseline' : undefined,
        className: shouldUseSecondaryXAxis ? 'baseline-dual-axis' : '',
      },
    ];

    let secondaryAxis, xAxisTotalHeight;
    if (shouldUseSecondaryXAxis) {
      secondaryAxis = (
        <SecondaryTSXAxis
          margin={{ left: this.margin.left, right: this.margin.right, top: 0, bottom: 0 }}
          width={parentWidth}
          millisSet={millisSetCanary}
          axisLabel={'canary'}
          bottomOffset={0}
        />
      );
      xAxisTotalHeight = 2 * (axisLabelHeight + axisTickLabelHeight) + axisTickLineHeight;
    } else {
      secondaryAxis = null;
      xAxisTotalHeight = axisTickLabelHeight;
    }

    const computedConfig = {
      lines: chartData,
      size: [parentWidth, this.chartHeight + xAxisTotalHeight],
      margin: { ...this.margin, top: 0, bottom: xAxisTotalHeight },
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
        <div className={'chart-title'} style={{ height: this.headerHeight }}>
          {'Canary Value Differences from Baseline'}
        </div>
        <XYFrame {...computedConfig} />
        {secondaryAxis}
      </div>
    );
  }
}
