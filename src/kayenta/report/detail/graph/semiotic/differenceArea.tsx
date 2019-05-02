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
    const maxDataPoints = Math.max(experiment.length, control.length);
    const millisSetValidValues = [] as number[];
    const millisSetUnfiltered = [] as number[];
    const differenceDataPoints: IDataPoint[] = [];
    const baselineReferenceDataPoints: IDataPoint[] = [];
    Array(maxDataPoints)
      .fill(0)
      .forEach((_, i) => {
        let e = experiment[i];
        let c = control[i];
        let timestampMillis = scopes.control.startTimeMillis + i * stepMillis;
        millisSetUnfiltered.push(timestampMillis);
        if (typeof c === 'number' || typeof e === 'number') {
          millisSetValidValues.push(timestampMillis);
          baselineReferenceDataPoints.push({
            timestampMillis,
            value: 0,
          });
          if (typeof c === 'number' && typeof e === 'number') {
            differenceDataPoints.push({
              timestampMillis,
              value: e - c,
            });
          }
        }
      });
    const xExtent = [millisSetValidValues[0], millisSetValidValues[millisSetValidValues.length - 1]];
    return {
      chartData: [
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
      ],

      // set the xExtent to be between the earliest and latest timestamp with valid numerical value
      // This needs to be explicitly stated to align the time window with the minimap's
      xExtent: xExtent,

      //all millis values within the xExtent range. Required for custom tick labelling
      millisSet: millisSetUnfiltered.filter((ms: number) => ms >= xExtent[0] && ms <= xExtent[1]),
    };
  };

  public render() {
    const { metricSetPair, parentWidth } = this.props;

    const { axisTickLineHeight, axisTickLabelHeight, axisLabelHeight } = vizConfig.timeSeries;

    /*
    * Generate the data needed for the graph components
    */
    const { scopes } = metricSetPair;
    const { chartData, xExtent, millisSet } = this.formatDifferenceTSData(metricSetPair);
    const millisOffset = scopes.experiment.startTimeMillis - scopes.control.startTimeMillis;
    const millisSetCanary = millisOffset === 0 ? millisSet : millisSet.map((ms: number) => ms + millisOffset);

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
        tickFormat: () => `\u0394 = 0`, // Δ = 0
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
      xExtent,
    };

    return (
      <div className={'difference-area'}>
        <div className={'chart-title'} style={{ height: this.headerHeight }}>
          Canary Value Differences from Baseline
        </div>
        <XYFrame {...computedConfig} />
        {secondaryAxis}
      </div>
    );
  }
}
