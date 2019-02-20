///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { OrdinalFrame } from 'semiotic';
import { histogram, extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';

import * as utils from './utils';
import { vizConfig } from './config';
import { ISemioticChartProps } from './semiotic.service';
import './graph.less';
import ChartHeader from './chartHeader';
import ChartLegend from './chartLegend';

// moment.tz.setDefault(defaultTimeZone);

interface IInputDataPoint {
  value: number;
  group: string;
}

interface IChartDataPoint {
  count: number;
  x0: number;
  x1: number;
}

export default class Histogram extends React.Component<ISemioticChartProps> {
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

    // split the datasets to canary vs. baseline and count elements on each bin
    // define the ordinal values as each bin's ending threshold (x1)
    let baselineChartData: IChartDataPoint[] = [],
      canaryChartData: IChartDataPoint[] = [];

    histogramData.forEach(h => {
      const { x0, x1 } = h;
      const baselineBin = { x0: x0, x1: x1, count: 0 };
      const canaryBin = { x0: x0, x1: x1, count: 0 };
      h.forEach(d => (d.group === 'baseline' ? baselineBin.count++ : canaryBin.count++));
      baselineChartData.push(baselineBin);
      canaryChartData.push(canaryBin);
    });
    console.log('histogram data');
    console.log(baselineChartData);
    return { baselineChartData, canaryChartData };
  };

  // onChartHover = (d:any) => {
  //   const {
  //     config
  //   } = this.props
  //
  //   if(d){
  //     let tooltipRows = d.coincidentPoints
  //       .map((cp:any) =>{
  //         return {
  //           color: cp.parentLine.color,
  //           label: cp.parentLine.label,
  //           value: cp.data.value,
  //         }
  //       })
  //       .sort((a:any,b:any) => a.value-b.value)
  //       .map((o:any) => {
  //         const labelStyle = { color: o.color }
  //         return (
  //           <div id={o.label}>
  //             <span style={labelStyle}>{`${o.label}: `}</span><span>{o.value}</span>
  //           </div>
  //         )
  //       })
  //
  //     const style = {
  //
  //     }
  //
  //     const tooltipContent = (
  //       <div style={style}>
  //         <div>{moment(d.data.timestampMillis).format('YYYY-MM-DD HH:MM:SS z')}</div>
  //         {tooltipRows}
  //       </div>
  //     )
  //
  //     this.setState({
  //       tooltip: {
  //         content: tooltipContent,
  //         x: d.voronoiX + config.margin.left,
  //         y: d.voronoiY + config.margin.top
  //       }
  //     })
  //   }
  //
  //   else this.setState({tooltip:null})
  // }

  render(): any {
    console.log('Histogram...');
    console.log(this.props);
    const { metricSetPair, config, parentWidth } = this.props;

    const { baselineChartData, canaryChartData } = this.generateChartData();

    console.log('baselineChartData');
    console.log(baselineChartData);
    const maxCount = Math.max(...baselineChartData.map(o => o.count), ...canaryChartData.map(o => o.count));

    const computedConfig = {
      size: [parentWidth, config.height / 2],
      margin: {
        top: 0,
        bottom: 20,
        left: 40,
        right: 10,
      },
      projection: 'vertical',
      type: 'bar',
      oLabel: (v: number) => <text>{utils.formatMetricValue(v)}</text>,
      oPadding: 1,
      oAccessor: (d: IChartDataPoint) => d.x1,
    };

    const axis = {
      orient: 'left',
      tickFormat: (d: number) => (d === 0 ? null : Math.abs(d)),
    };

    const canaryGraph = (
      <OrdinalFrame
        {...computedConfig}
        data={canaryChartData}
        axis={axis}
        rExtent={[0, maxCount]}
        rAccessor={(d: IChartDataPoint) => d.count}
        style={{ fill: vizConfig.colors.canary }}
      />
    );

    const baselineGraph = (
      <OrdinalFrame
        {...computedConfig}
        data={baselineChartData}
        axis={axis}
        rExtent={[0, -maxCount]}
        rAccessor={(d: IChartDataPoint) => -d.count}
        oLabel={false}
        style={{ fill: vizConfig.colors.baseline }}
      />
    );

    return (
      <div className={'graph-container'}>
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend />
        <div className={'canary-chart'}>{canaryGraph}</div>
        <div className={'baseline-chart'}>{baselineGraph}</div>
      </div>
    );
  }
}
