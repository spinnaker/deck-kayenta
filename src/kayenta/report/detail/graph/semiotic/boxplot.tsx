///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { OrdinalFrame, Annotation } from 'semiotic';
import { extent } from 'd3-array';

import * as utils from './utils';
import { vizConfig } from './config';
import {
  ISemioticChartProps,
  IMargin,
  // ISummaryStatistics,
} from './semiotic.service';
import ChartHeader from './chartHeader';
import ChartLegend from './chartLegend';
import './graph.less';
import './boxplot.less';
import Tooltip from './tooltip';
import CircleIcon from './circleIcon';

interface IChartDataPoint {
  value: number;
  group: string;
  color: string;
}

interface IBoxPlotState {
  tooltip: any;
}

export default class BoxPlot extends React.Component<ISemioticChartProps, IBoxPlotState> {
  state: IBoxPlotState = {
    tooltip: null,
  };

  private margin: IMargin = {
    top: 10,
    bottom: 20,
    left: 60,
    right: 40,
  };

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

  createChartHoverHandler = () => {
    // console.log(dataSet);
    return (d: any): void => {
      // console.log('d+++');
      // console.log(d);

      if (d && d.type === 'frame-hover') {
        const points = d.points;

        let data: any = {
          baseline: [] as any[],
          canary: [] as any[],
        };

        points.forEach((p: any) => {
          const dataGroup: any[] = data[p.key];
          dataGroup.push({ label: p.label, value: p.value });
        });

        const summaryLabels = data.baseline.map((b: any) => b.label);

        const summaryKeysColumn = [
          <div className={'header'} key={'summary'}>
            {'Summary'}
          </div>,
          ...summaryLabels.map((label: any) => {
            return <div key={label}>{label}</div>;
          }),
        ];

        const baselineColumn = [
          <div className={'header'} key={'baseline'}>
            <CircleIcon group={'baseline'} />
            {'Baseline'}
          </div>,
          data.baseline.map((b: any, k: string) => {
            return <div key={k}>{utils.formatMetricValue(b.value)}</div>;
          }),
        ];

        const canaryColumn = [
          <div className={'header'} key={'canary'}>
            <CircleIcon group={'canary'} />
            {'Canary'}
          </div>,
          data.canary.map((b: any, k: string) => {
            return <div key={k}>{utils.formatMetricValue(b.value)}</div>;
          }),
        ];

        const tooltipContent = (
          <div className={'tooltip-container'}>
            <div className={'columns'}>
              <div className={'column'}>{summaryKeysColumn}</div>
              <div className={'column'}>{baselineColumn}</div>
              <div className={'column'}>{canaryColumn}</div>
            </div>
          </div>
        );

        this.setState({
          tooltip: {
            content: tooltipContent,
            x: d.x + this.margin.left,
            y: d.y + this.margin.top,
          },
        });
      } else this.setState({ tooltip: null });
    };
  };

  defineAnnotations = () => {
    const annotations = [] as any[];
    const groups = ['baseline', 'canary'];
    const summaryKeys = ['q1area', 'median', 'q3area'] as string[];
    groups.forEach(g => {
      summaryKeys.forEach(k => {
        annotations.push({
          type: 'summary-custom',
          group: g,
          summaryKey: k,
        });
      });
    });
    return annotations;
  };

  customAnnotationFunction: any = (args: any): any => {
    const {
      d,
      i,
      orFrameState: { pieceDataXY },
      categories,
    } = args;
    // console.log('args+++')
    // console.log(args)
    // console.log(args.oScale('canary'))
    // console.log(args.rScale(0.15))
    // console.log(args.rScale(0.2))
    // console.log(args.rScale(0.4))

    if (d.type === 'summary-custom') {
      const summaryData = pieceDataXY.filter((sd: any) => sd.key === d.group);
      const median = summaryData.find((sd: any) => sd.summaryPieceName === 'median');
      const q1 = summaryData.find((sd: any) => sd.summaryPieceName === 'q1area');
      const q3 = summaryData.find((sd: any) => sd.summaryPieceName === 'q3area');
      const boxPlotWidth = categories.baseline.width;

      const createNoteElement = (dataPoint: any, label: string) => {
        const noteData = {
          x: dataPoint.x,
          y: dataPoint.y,
          dx: boxPlotWidth / 2,
          dy: dataPoint.summaryPieceName === 'median' ? 0 : dataPoint.summaryPieceName === 'q1area' ? 30 : -30,
          note: {
            label: `${label}: ${utils.formatMetricValue(dataPoint.value)}`,
            wrap: 100,
            lineType: 'vertical',
            align: 'middle',
            orientation: 'topBottom',
            padding: 10,
          },
          className: `boxplot-annotation`,
        };
        return <Annotation key={i} noteData={noteData} />;
      };

      let label;

      if (d.summaryKey === 'median') {
        if (median.value === q1.value && median.value === q3.value) label = '25th %-ile, median & 75th %-ile';
        else if (median.value === q1.value) label = '25th %-ile & median';
        else if (median.value === q3.value) label = 'median & 75th %-ile';
        else label = 'median';
        return createNoteElement(median, label);
      } else if (d.summaryKey === 'q1area') {
        return median.value === q1.value ? null : createNoteElement(q1, '25th %-ile');
      } else if (d.summaryKey === 'q3area') {
        return median.value === q3.value ? null : createNoteElement(q3, '75th %-ile');
      }
    } else return null;
  };

  render(): any {
    console.log('Box plot...');
    console.log(this.props);
    const { metricSetPair, config, parentWidth } = this.props;

    const { chartData } = this.generateChartData();

    console.log('chartData');
    console.log(chartData);

    const chartHoverHandler = this.createChartHoverHandler();

    const annotations = this.defineAnnotations();

    const computedConfig = {
      size: [parentWidth, config.height],
      margin: this.margin,
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
      customHoverBehavior: chartHoverHandler,
      hoverAnnotation: false,
      annotations,
    };

    const axis = {
      orient: 'left',
      label: 'metric value',
      tickFormat: (d: number) => utils.formatMetricValue(d),
    };

    const graph = (
      <OrdinalFrame
        {...computedConfig}
        summaryHoverAnnotation={[]}
        data={chartData}
        axis={axis}
        oAccessor={(d: IChartDataPoint) => d.group}
        rAccessor={(d: IChartDataPoint) => d.value}
        style={(d: IChartDataPoint) => ({ fill: d.color, opacity: 0.8 })}
        svgAnnotationRules={this.customAnnotationFunction}
      />
    );

    return (
      <div className={'box-graph-container'}>
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend />
        <div className={'graph-container'}>
          <div className={'box-plot-chart'}>{graph}</div>
          <Tooltip {...this.state.tooltip} />
        </div>
      </div>
    );
  }
}
