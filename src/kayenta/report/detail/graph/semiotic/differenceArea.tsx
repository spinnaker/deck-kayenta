///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { scaleUtc } from 'd3-scale';
import { XYFrame } from 'semiotic';
import * as moment from 'moment-timezone';
import { curveStepAfter } from 'd3-shape';

import { IMetricSetPair } from 'kayenta/domain/IMetricSetPair';
import { ISemioticChartProps, IMargin } from './semiotic.service';
import { vizConfig } from './config';
import './differenceArea.less';
import * as utils from './utils';

interface IDataPoint {
  timestampMillis: number;
  value: number;
}

interface IChartDataSet {
  label: string;
  color: string;
  coordinates: IDataPoint[];
}

interface IDifferenceAreaProps extends ISemioticChartProps {
  height: number;
  headerHeight: number;
}

/*
* Supplemental visualization in the time series view to highlight
* Canary difference to baseline at any given timestamp
*/

export default class DifferenceArea extends React.Component<IDifferenceAreaProps> {
  private margin: IMargin = {
    top: 0,
    bottom: 40,
    left: 60,
    right: 20,
  };

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
    const { metricSetPair, parentWidth, height, headerHeight } = this.props;
    const startTimeMillis = metricSetPair.scopes.control.startTimeMillis;
    const millisSet = metricSetPair.values.control.map((_, i: number) => {
      return startTimeMillis + i * metricSetPair.scopes.control.stepMillis;
    });

    const chartData = this.formatDifferenceTSData(metricSetPair);
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
        tickFormat: () => {
          return `\u0394 = 0`;
        },
        tickValues: [0],
      },
      {
        orient: 'bottom',
        tickValues: utils.calculateDateTimeTicks(millisSet),
        tickFormat: (d: number) => {
          //custom labels
          const text = utils.dateTimeTickFormatter(d).map((s: string) => (
            <text textAnchor={'middle'} className={'axis-label'}>
              {s}
            </text>
          ));
          return <g className={'axis-label'}>{text}</g>;
        },
      },
    ];

    const computedConfig = {
      lines: chartData,
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
        <div className={'chart-title'} style={{ height: headerHeight }}>
          {'Canary Value Differences from Baseline'}
        </div>
        <XYFrame {...computedConfig} />
      </div>
    );
  }
}
