///<reference path="./declarations/semiotic.d.ts" />
///<reference path="./declarations/labella.d.ts" />

import * as React from 'react';
import { OrdinalFrame, Annotation } from 'semiotic';
import { extent } from 'd3-array';
import { Node, Force } from 'labella';

import * as utils from './utils';
import { vizConfig } from './config';
import { ISemioticChartProps, IMargin, ITooltip } from './semiotic.service';
import ChartHeader from './chartHeader';
import ChartLegend from './chartLegend';
import './boxplot.less';
import Tooltip from './tooltip';
import CircleIcon from './circleIcon';

interface IChartDataPoint {
  value: number;
  group: string;
  color: string;
}

interface IBoxPlotState {
  tooltip: ITooltip;
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

  // Generate tooltip content that shows the summary statistics of a boxplot
  createChartHoverHandler = () => {
    return (d: any): void => {
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
    groups.forEach(g => {
      annotations.push({
        type: 'summary-custom',
        group: g,
        summaryKeys: ['q1area', 'median', 'q3area'],
      });
    });
    return annotations;
  };

  customAnnotationFunction: any = (args: any): any => {
    const {
      d,
      orFrameState: { pieceDataXY },
      categories,
    } = args;

    if (d.type === 'summary-custom') {
      const summaryData = pieceDataXY.filter((sd: any) => sd.key === d.group);
      const boxPlotWidth = categories.baseline.width;

      const createNoteElement = (posY: number, dataPoint: any) => {
        const name = dataPoint.summaryPieceName;
        const label = name === 'median' ? 'median' : name === 'q1area' ? '25th %-ile' : '75th %-ile';
        const noteData = {
          x: dataPoint.x,
          y: posY,
          dx: boxPlotWidth / 2,
          dy: 0,
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
        return <Annotation key={name} noteData={noteData} />;
      };

      let nodes: any[] = [];
      d.summaryKeys.forEach((summaryKey: string) => {
        const pieceData = summaryData.find((sd: any) => sd.summaryPieceName === summaryKey);
        if (pieceData) {
          nodes.push(new Node(pieceData.y, 20, { summaryKey, pieceData }));
        }
      });
      const forceOptions = {
        minPos: this.margin.top,
        maxPos: vizConfig.height - this.margin.bottom,
      };
      const force = new Force(forceOptions).nodes(nodes).compute();

      let annotations: any[] = [];
      force.nodes().forEach((n: any) => {
        annotations.push(createNoteElement(n.currentPos, n.data.pieceData));
      });
      return annotations;
    } else return null;
  };

  render(): any {
    const { metricSetPair, parentWidth } = this.props;
    const { chartData } = this.generateChartData();
    const chartHoverHandler = this.createChartHoverHandler();
    const annotations = this.defineAnnotations();

    const computedConfig = {
      size: [parentWidth, vizConfig.height],
      margin: this.margin,
      projection: 'vertical',
      summaryType: 'boxplot',
      oLabel: false,
      oPadding: 160,
      style: (d: IChartDataPoint) => {
        return {
          fill: d.color,
          fillOpacity: 0.7,
        };
      },
      summaryStyle: (d: IChartDataPoint) => {
        return {
          fill: d.color,
          fillOpacity: 0.4,
          stroke: '#6a6a6a',
          strokeWidth: 2,
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
        svgAnnotationRules={this.customAnnotationFunction}
        summaryClass={'boxplot-summary'}
      />
    );

    return (
      <div className={'boxplot'}>
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend />
        <div className={'graph-container'}>
          <div className={'boxplot-chart'}>{graph}</div>
          <Tooltip {...this.state.tooltip} />
        </div>
      </div>
    );
  }
}
