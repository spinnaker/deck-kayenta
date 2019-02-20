///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { OrdinalFrame } from 'semiotic';
import { extent } from 'd3-array';

import * as utils from './utils';
import { vizConfig } from './config';
import { ISemioticChartProps } from './semiotic.service';
import ChartHeader from './chartHeader';
import ChartLegend from './chartLegend';
import './graph.less';

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
        top: 20,
        bottom: 10,
        left: 50,
        right: 10,
      },
      projection: 'vertical',
      summaryType: 'boxplot',
      oLabel: false,
      oPadding: 160,
      summaryStyle: (d: IChartDataPoint) => {
        return {
          fill: d.color,
          fillOpacity: 0.3,
          stroke: '#6a6a6a',
          strokeWidth: 2,
          opacity: 0.8,
        };
      },
      pieceClass: (d: IChartDataPoint) => `piece ${d.group}`,
      type: {
        type: 'swarm',
        r: 3,
        iterations: 50,
      },
      rExtent: extent(chartData.map(o => o.value)),
    };

    const axis = {
      orient: 'left',
      tickFormat: (d: number) => utils.formatMetricValue(d),
    };

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
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend />
        <div className={'box-plot-chart'}>{graph}</div>
      </div>
    );
  }
}
