///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { OrdinalFrame } from 'semiotic';
import { histogram, extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';

import * as utils from './utils';
import { vizConfig } from './config';
import { ISemioticChartProps, IMargin } from './semiotic.service';
import './graph.less';
import ChartHeader from './chartHeader';
import ChartLegend from './chartLegend';

interface IInputDataPoint {
  value: number;
  group: string;
}

interface IChartDataPoint {
  group: string;
  count: number;
  x0: number;
  x1: number;
}

export default class Histogram extends React.Component<ISemioticChartProps> {
  private margin: IMargin = {
    top: 10,
    bottom: 20,
    left: 40,
    right: 10,
  };

  decorateData = (dataPoints: number[], group: string): IInputDataPoint[] => {
    return dataPoints.map(dp => ({
      value: dp,
      group: group,
    }));
  };

  generateChartData = () => {
    const { metricSetPair } = this.props;

    const filterFunc = (v: IInputDataPoint) => typeof v.value === 'number';
    const baselineInput = this.decorateData(metricSetPair.values.control, 'baseline');
    const canaryInput = this.decorateData(metricSetPair.values.experiment, 'canary');
    const combinedInput = baselineInput.concat(canaryInput).filter(filterFunc);

    const x = scaleLinear()
      .domain(extent(combinedInput.map(o => o.value)))
      .nice();
    const domain = x.domain() as [number, number];

    // create histogram bins based on the combined data points
    const histogramData = histogram<IInputDataPoint, number>()
      .domain(domain)
      .value((d: IInputDataPoint) => d.value)(combinedInput);

    let chartData: IChartDataPoint[] = [];

    histogramData.forEach(h => {
      const { x0, x1 } = h;
      const baselineBin = { group: 'baseline', x0: x0, x1: x1, count: 0 };
      const canaryBin = { group: 'canary', x0: x0, x1: x1, count: 0 };
      h.forEach(d => (d.group === 'baseline' ? baselineBin.count++ : canaryBin.count++));
      chartData.push(baselineBin);
      chartData.push(canaryBin);
    });
    console.log('histogram data');
    console.log(histogramData);
    return chartData;
  };

  createChartHoverHandler = (dataSet: IChartDataPoint[]) => {
    console.log(dataSet);
    return (d: any): void => {
      console.log('d+++');
      console.log(d);
      // if (d) {
      //   const timestampMillis = d.timestampMillis;
      //   const tooltipRows = dataSets
      //     .map(ds => {
      //       const dataPoint = ds.coordinates.find(o => o.timestampMillis === timestampMillis);
      //       return {
      //         color: ds.color,
      //         label: ds.label,
      //         value: dataPoint ? utils.formatMetricValue(dataPoint.value) : null,
      //       };
      //     })
      //     .sort((a: any, b: any) => b.value - a.value)
      //     .map((o: any) => {
      //       const labelStyle = { color: o.color };
      //       return (
      //         <div id={o.label}>
      //           <span style={labelStyle}>{`${o.label}: `}</span>
      //           <span>{o.value}</span>
      //         </div>
      //       );
      //     });
      //
      //   const style = {};
      //
      //   const tooltipContent = (
      //     <div style={style}>
      //       <div>{moment(d.data.timestampMillis).format('YYYY-MM-DD HH:mm:ss z')}</div>
      //       {tooltipRows}
      //     </div>
      //   );
      //
      //   this.setState({
      //     tooltip: {
      //       content: tooltipContent,
      //       x: d.voronoiX + config.margin.left,
      //       y: d.voronoiY + config.margin.top,
      //     },
      //   });
      // } else this.setState({ tooltip: null });
    };
  };

  render(): any {
    console.log('Histogram...');
    console.log(this.props);
    const { metricSetPair, parentWidth } = this.props;

    const chartData = this.generateChartData();

    const axis = {
      orient: 'left',
      tickFormat: (d: number) => (d === 0 ? null : Math.abs(d)),
    };

    const chartHoverHandler = this.createChartHoverHandler(chartData);

    const computedConfig = {
      size: [parentWidth, vizConfig.height],
      margin: this.margin,
      projection: 'vertical',
      type: 'clusterbar',
      oLabel: (v: number) => <text text-anchor={'middle'}>{utils.formatMetricValue(v)}</text>,
      oPadding: 10,
      oAccessor: (d: IChartDataPoint) => d.x1,
      style: (d: IChartDataPoint) => {
        return {
          fill: vizConfig.colors[d.group],
        };
      },
      customHoverBehavior: chartHoverHandler,
      data: chartData,
      axis: axis,
      rAccessor: (d: IChartDataPoint) => d.count,
      hoverAnnotation: true,
    };

    const graph = <OrdinalFrame {...computedConfig} />;

    return (
      <div className={'graph-container'}>
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend />
        <div className={'canary-chart'}>{graph}</div>
      </div>
    );
  }
}
