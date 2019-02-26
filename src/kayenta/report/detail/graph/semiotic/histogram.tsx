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
import Tooltip from './tooltip';

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

interface IHistogramState {
  tooltip: any;
}

export default class Histogram extends React.Component<ISemioticChartProps, IHistogramState> {
  state: IHistogramState = {
    tooltip: null,
  };

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

      if (d && d.type === 'column-hover') {
        const xyData = d.column.xyData;
        const x = xyData[1].xy.x;
        const halfHeight1 = xyData[0].xy.height / 2;
        const halfHeight2 = xyData[1].xy.height / 2;
        const y = vizConfig.height - this.margin.bottom - Math.min(halfHeight1, halfHeight2) - 10;
        const { x0, x1 } = d.summary[0].data;
        const tooltipRows = d.summary.map((s: any) => {
          const { group, count } = s.data;
          const labelStyle = {
            color: vizConfig.colors[group],
            fontSize: 14,
          };
          const valueStyle = {
            fontWeight: 'bold',
          } as React.CSSProperties;

          return (
            <div id={group}>
              <span style={labelStyle}>&#9679;</span>
              <span>{` ${group} count: `}</span>
              <span style={valueStyle}>{count}</span>
            </div>
          );
        });
        const tooltipContent = (
          <div>
            <div>
              {`For metric value greater than ${utils.formatMetricValue(x0)} ` +
                `and less than or equal to ${utils.formatMetricValue(x1)}`}
            </div>
            {tooltipRows}
          </div>
        );

        this.setState({
          tooltip: {
            content: tooltipContent,
            x: x + this.margin.left,
            y: y + this.margin.top,
          },
        });
      } else this.setState({ tooltip: null });
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
      oLabel: (v: number) => <text textAnchor={'middle'}>{utils.formatMetricValue(v)}</text>,
      oPadding: 20,
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
    };

    const graph = <OrdinalFrame {...computedConfig} hoverAnnotation={[]} />;

    return (
      <div>
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend />
        <div className={'graph-container'}>
          <div className={'canary-chart'}>{graph}</div>
          <Tooltip {...this.state.tooltip} />
        </div>
      </div>
    );
  }
}
