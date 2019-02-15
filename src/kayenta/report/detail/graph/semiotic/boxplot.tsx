///<reference path="./semiotic.d.ts" />

import * as React from 'react';
import { OrdinalFrame } from 'semiotic';
import * as classNames from 'classnames';
import { extent } from 'd3-array';
// import { scaleLinear } from 'd3-scale'
// import * as moment from 'moment-timezone';
// import { SETTINGS } from '@spinnaker/core';
// const { defaultTimeZone } = SETTINGS;
// import Tooltip from './tooltip'

// import { IMetricSetScope } from 'kayenta/domain/IMetricSetPair';
import * as utils from './utils';
import { vizConfig } from './config';
import { ISemioticChartProps } from './semiotic.service';
// import './graph.less';

// moment.tz.setDefault(defaultTimeZone);

interface IChartDataPoint {
  value: number;
  group: string;
  color: string;
}

export default class BoxPlot extends React.Component<ISemioticChartProps> {
  decorateData = (dataPoints: number[], group: string): IChartDataPoint[] => {
    return dataPoints.map(dp => ({
      value: dp,
      group: group,
      color: vizConfig.colors[group],
    }));
  };

  generateChartData = () => {
    const { metricSetPair } = this.props;

    const filterFunc = (v: IChartDataPoint) => typeof v.value === 'number';
    const baselineInput = this.decorateData(metricSetPair.values.control, 'baseline');
    const canaryInput = this.decorateData(metricSetPair.values.experiment, 'canary');
    const chartData = baselineInput.concat(canaryInput).filter(filterFunc);

    return { chartData };
  };

  render(): any {
    console.log('Box plot...');
    console.log(this.props);
    const { metricSetPair, config, parentWidth } = this.props;

    const { chartData } = this.generateChartData();

    console.log('chartData');
    console.log(chartData);

    const computedConfig = {
      size: [parentWidth, config.height],
      margin: {
        top: 40,
        bottom: 40,
        left: 40,
        right: 10,
      },
      projection: 'vertical',
      summaryType: 'boxplot',
      oLabel: {
        label: true,
        padding: 40,
      },
      oPadding: 20,
      summaryStyle: (d: IChartDataPoint) => {
        return {
          fill: d.color,
          fillOpacity: 0.6,
          stroke: '#6a6a6a',
          opacity: 0.8,
        };
      },
      style: (d: IChartDataPoint) => ({ fill: d.color, opacity: 0.6 }),
      type: {
        type: 'swarm',
        r: 2,
        iterations: 50,
      },
      rExtent: extent(chartData.map(o => o.value)),
    };

    const axis = {
      orient: 'left',
      tickFormat: (d: number) => utils.formatMetricValue(d),
    };

    const title = (
      <h6 className={classNames('heading-6', 'color-text-primary')}>
        {'Box Swarm Plot for Metric '}
        <b>{metricSetPair.name}</b>
      </h6>
    );

    const graph = (
      <OrdinalFrame
        {...computedConfig}
        data={chartData}
        axis={axis}
        oAccessor={(d: IChartDataPoint) => d.group}
        rAccessor={(d: IChartDataPoint) => d.value}
        style={(d: IChartDataPoint) => ({ fill: d.color, opacity: 0.8 })}
      />
    );

    return (
      <div className={'box-graph-container'}>
        <div className={'chart-title'}>{title}</div>
        <div className={'box-plot-chart'}>{graph}</div>
      </div>
    );
  }
}
