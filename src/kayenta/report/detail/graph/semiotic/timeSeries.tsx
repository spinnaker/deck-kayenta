///<reference path="./semiotic.d.ts" />

import * as React from 'react';
import { scaleUtc } from 'd3-scale';
import { XYFrame } from 'semiotic';
import * as moment from 'moment-timezone';
import { SETTINGS } from '@spinnaker/core';
const { defaultTimeZone } = SETTINGS;
import { curveStepAfter } from 'd3';
import Tooltip from './tooltip';

import { IMetricSetScope } from 'kayenta/domain/IMetricSetPair';
import * as classNames from 'classnames';
import { ISemioticChartProps } from './semiotic.service';
import './graph.less';
import { vizConfig } from './config';

moment.tz.setDefault(defaultTimeZone);

interface IDataPoint {
  timestampMillis: number;
  value: number | null;
}

interface IDataSet {
  color: string;
  label: string;
  coordinates: IDataPoint[];
}

interface ITimeSeriesState {
  tooltip: any;
}

export default class TimeSeries extends React.Component<ISemioticChartProps> {
  state: ITimeSeriesState = {
    tooltip: null,
  };

  formatTSData = (values: number[], scope: IMetricSetScope, properties: object) => {
    const stepMillis = scope.stepMillis;
    let dataPoints = values.map((v, i) => {
      return {
        timestampMillis: scope.startTimeMillis + i * stepMillis,
        value: typeof v === 'number' ? v : null,
      };
    });
    return {
      ...properties,
      coordinates: dataPoints,
    };
  };

  onChartHover = (d: any) => {
    const { config } = this.props;

    if (d) {
      let tooltipRows = d.coincidentPoints
        .map((cp: any) => {
          return {
            color: cp.parentLine.color,
            label: cp.parentLine.label,
            value: cp.data.value,
          };
        })
        .sort((a: any, b: any) => a.value - b.value)
        .map((o: any) => {
          const labelStyle = { color: o.color };
          return (
            <div id={o.label}>
              <span style={labelStyle}>{`${o.label}: `}</span>
              <span>{o.value}</span>
            </div>
          );
        });

      const style = {};

      const tooltipContent = (
        <div style={style}>
          <div>{moment(d.data.timestampMillis).format('YYYY-MM-DD HH:MM:SS z')}</div>
          {tooltipRows}
        </div>
      );

      this.setState({
        tooltip: {
          content: tooltipContent,
          x: d.voronoiX + config.margin.left,
          y: d.voronoiY + config.margin.top,
        },
      });
    } else this.setState({ tooltip: null });
  };

  render(): any {
    console.log('TimeSeries...');
    console.log(this.props);
    const { metricSetPair, config, parentWidth } = this.props;

    const baselineDataProps = {
      color: vizConfig.colors.baseline,
      label: 'baseline',
    };
    const baselineData = this.formatTSData(
      metricSetPair.values.control,
      metricSetPair.scopes.control,
      baselineDataProps,
    );
    const canaryDataProps = {
      color: vizConfig.colors.canary,
      label: 'canary',
    };
    const canaryData = this.formatTSData(
      metricSetPair.values.experiment,
      metricSetPair.scopes.experiment,
      canaryDataProps,
    );
    const data = [baselineData, canaryData];

    /* data format
      [
        {
          attribute1: val1,
          attribute2: val2,
          coordinates: [
            { timestamp: "2018-11-06T00:00:00.000Z", value: 0}
          ]
        }
      ]
    */

    const lineStyleFunc = (ds: IDataSet) => {
      return {
        stroke: ds.color,
        strokeWidth: 2,
        strokeOpacity: 0.8,
      };
    };

    const computedConfig = {
      size: [parentWidth, config.height],
      margin: config.margin,
    };

    const axes = [
      { orient: 'left' },
      {
        orient: 'bottom',
        ticks: 8,
        // tickValues: xTickValues,
        tickFormat: (d: number) => {
          return moment(d).format('h:mma');
        },
      },
    ];

    const lineType = {
      type: 'line',
      interpolator: curveStepAfter,
    };

    const hoverAnnotations = [
      {
        type: 'x',
        disable: ['connector', 'note'],
      },
      {
        type: 'vertical-points',
        threshold: 0.1,
        r: () => 5,
      },
    ];

    const title = (
      <h6 className={classNames('heading-6', 'color-text-primary')}>
        {'Time Series for Metric '}
        <b>{metricSetPair.name}</b>
      </h6>
    );

    const graph = (
      <XYFrame
        {...computedConfig}
        lines={data}
        lineType={lineType}
        lineStyle={lineStyleFunc}
        xScaleType={scaleUtc()}
        xAccessor={(d: IDataPoint) => new Date(d.timestampMillis)}
        yAccessor={'value'}
        axes={axes}
        hoverAnnotation={hoverAnnotations}
        customHoverBehavior={this.onChartHover}
      />
    );

    return (
      <div className={'graph-container'}>
        <div className={'chart-title'}>{title}</div>
        <div className={'time-series-chart'}>{graph}</div>
        <Tooltip {...this.state.tooltip} />
      </div>
    );
  }
}
