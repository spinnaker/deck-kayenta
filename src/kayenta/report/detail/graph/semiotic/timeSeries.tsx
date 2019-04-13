///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { scaleUtc } from 'd3-scale';
import { MinimapXYFrame, XYFrame } from 'semiotic';
import * as moment from 'moment-timezone';
import { SETTINGS } from '@spinnaker/core';
const { defaultTimeZone } = SETTINGS;
import { curveStepAfter } from 'd3-shape';
import { IMetricSetScope } from 'kayenta/domain/IMetricSetPair';

import * as utils from './utils';
import Tooltip from './tooltip';
import ChartHeader from './chartHeader';
import ChartLegend from './chartLegend';
import { ISemioticChartProps, IMargin, ITooltip } from './semiotic.service';
import './timeSeries.less';
import { vizConfig } from './config';
import CircleIcon from './circleIcon';
import DifferenceArea from './differenceArea';

moment.tz.setDefault(defaultTimeZone);

interface IDataPoint {
  timestampMillis: number;
  value: number | null;
}

interface IChartDataSet {
  color: string;
  label: string;
  coordinates: IDataPoint[];
}

interface ITimeSeriesState {
  tooltip: ITooltip;
  userBrushExtent: number[];
}

interface ITooltipDataPoint {
  color: string;
  label: string;
  value: number | null;
}

/*There are 3 vizualisations inside this component:
1. The main Timeseries chart
2. The minimap chart for users to zoom/ pan the main timeseries. Only show this if there are many data points
3. The difference chart that displays the diff between canary and baseline
*/
export default class TimeSeries extends React.Component<ISemioticChartProps, ITimeSeriesState> {
  state: ITimeSeriesState = {
    tooltip: null,
    userBrushExtent: null,
  };

  private marginMain: IMargin = {
    top: 10,
    bottom: 40,
    left: 60,
    right: 20,
  };

  private marginMinimap: IMargin = {
    top: 0,
    bottom: 0,
    left: 60,
    right: 20,
  };

  formatTSData = (values: number[], scope: IMetricSetScope, properties: object) => {
    const stepMillis = scope.stepMillis;
    let dataPoints = values
      .map((v, i) => {
        return {
          timestampMillis: scope.startTimeMillis + i * stepMillis,
          value: typeof v === 'number' ? v : null,
        };
      })
      .filter(d => typeof d.value === 'number');

    return {
      ...properties,
      coordinates: dataPoints,
    };
  };

  // function factory to create a hover handler function based on the datasets
  createChartHoverHandler = (dataSets: IChartDataSet[]) => {
    return (d: any) => {
      if (d && d.timestampMillis) {
        const ts = d.timestampMillis;
        const dataPoints: { [group: string]: IDataPoint | undefined } = {
          canary: dataSets.find(o => o.label === 'canary').coordinates.find(c => c.timestampMillis === ts),
          baseline: dataSets.find(o => o.label === 'baseline').coordinates.find(c => c.timestampMillis === ts),
        };

        const canaryMinusBaseline =
          dataPoints.canary && dataPoints.baseline ? dataPoints.canary.value - dataPoints.baseline.value : null;

        const tooltipRows = dataSets
          .map(
            (ds: IChartDataSet): ITooltipDataPoint => {
              return {
                color: ds.color,
                label: ds.label,
                value: dataPoints[ds.label] ? dataPoints[ds.label].value : null,
              };
            },
          )
          .sort((a: ITooltipDataPoint, b: ITooltipDataPoint) => b.value - a.value)
          .map((o: ITooltipDataPoint) => {
            return (
              <div id={o.label} key={o.label}>
                <CircleIcon group={o.label} />
                <span>{`${o.label}: `}</span>
                <span>{utils.formatMetricValue(o.value)}</span>
              </div>
            );
          })
          .concat([
            <div id={'diff'} key={'diff'}>
              <span>{`${'Canary - Baseline'}: `}</span>
              <span>{utils.formatMetricValue(canaryMinusBaseline)}</span>
            </div>,
          ]);
        const tooltipContent = (
          <div>
            <div>{moment(d.data.timestampMillis).format('YYYY-MM-DD HH:mm:ss z')}</div>
            {tooltipRows}
          </div>
        );
        this.setState({
          tooltip: {
            content: tooltipContent,
            x: d.voronoiX + this.marginMain.left,
            y: d.voronoiY + this.marginMain.top,
          },
        });
      } else this.setState({ tooltip: null });
    };
  };

  //Handle user brush action event from semiotic
  onBrushEnd = (e: any) => {
    this.setState({
      userBrushExtent: e,
    });
  };

  render() {
    const { metricSetPair, parentWidth } = this.props;
    const { userBrushExtent } = this.state;
    const {
      minimapDataPointsThreshold,
      differenceAreaHeight,
      differenceAreaHeaderHeight,
      minimapHeight,
    } = vizConfig.timeSeries;
    let graphTS;

    const totalDifferenceAreaSectionHeight = differenceAreaHeight + differenceAreaHeaderHeight;
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
    const data = [baselineData, canaryData] as IChartDataSet[];
    const startTimeMillis = metricSetPair.scopes.control.startTimeMillis;
    const millisSet = metricSetPair.values.control.map((_, i: number) => {
      return startTimeMillis + i * metricSetPair.scopes.control.stepMillis;
    });
    const extentTS = [millisSet[0], millisSet[millisSet.length - 1]];

    // If there's no user extent defined, set the entire extent as default
    const xExtentMain = userBrushExtent ? userBrushExtent : [new Date(extentTS[0]), new Date(extentTS[1])];
    const millisSetMain = millisSet.filter((ms: number) => ms >= xExtentMain[0] && ms <= xExtentMain[1]);

    const shouldDisplayMinimap = metricSetPair.values.control.length > minimapDataPointsThreshold;
    const lineStyleFunc = (ds: IChartDataSet) => {
      return {
        stroke: ds.color,
        strokeWidth: 2,
        strokeOpacity: 0.8,
      };
    };
    const axesMain = [
      {
        orient: 'left',
        label: 'metric value',
        tickFormat: (d: number) => {
          return utils.formatMetricValue(d);
        },
      },
      {
        orient: 'bottom',
        tickValues: utils.calculateDateTimeTicks(millisSetMain),
        tickFormat: (d: number) => {
          //custom labels as we want two lines when showing date + hour
          const text = utils.dateTimeTickFormatter(d).map((s: string, i: number) => (
            <text textAnchor={'middle'} className={'axis-label'} key={i}>
              {s}
            </text>
          ));
          return <g className={'axis-label'}>{text}</g>;
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

    const chartHoverHandler = this.createChartHoverHandler(data);

    const commonTSConfig = {
      lines: data,
      lineType: lineType,
      lineStyle: lineStyleFunc,
      xAccessor: (d: IDataPoint) => moment(d.timestampMillis).toDate(),
      yAccessor: 'value',
      xScaleType: scaleUtc(),
    };

    const mainTSFrameProps = {
      ...commonTSConfig,
      hoverAnnotation: hoverAnnotations,
      customHoverBehavior: chartHoverHandler,
      xExtent: xExtentMain,
      axes: axesMain,
      margin: this.marginMain,
      matte: true,
    };

    if (shouldDisplayMinimap) {
      const axesMinimap = [
        {
          orient: 'left',
          tickFormat: (): void => null,
        },
        {
          orient: 'bottom',
          tickValues: utils.calculateDateTimeTicks(millisSet),
        },
      ];

      const minimapSize = [parentWidth, minimapHeight];
      const minimapConfig = {
        ...commonTSConfig,
        yBrushable: false,
        brushEnd: this.onBrushEnd,
        size: minimapSize,
        axes: axesMinimap,
        xBrushExtent: extentTS,
        margin: this.marginMinimap,
      };

      graphTS = (
        <MinimapXYFrame
          {...mainTSFrameProps}
          size={[parentWidth, vizConfig.height - minimapSize[1] - totalDifferenceAreaSectionHeight]}
          minimap={minimapConfig}
        />
      );
    } else {
      graphTS = (
        <XYFrame {...mainTSFrameProps} size={[parentWidth, vizConfig.height - totalDifferenceAreaSectionHeight]} />
      );
    }

    return (
      <div className={'time-series'}>
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend />
        <div className={'graph-container'}>
          <div className={'time-series-chart'}>{graphTS}</div>
          <Tooltip {...this.state.tooltip} />
        </div>
        {shouldDisplayMinimap ? (
          <div className={'zoom-icon'}>
            <i className="fas fa-search-plus" />
          </div>
        ) : null}
        <DifferenceArea {...this.props} height={differenceAreaHeight} headerHeight={differenceAreaHeaderHeight} />
      </div>
    );
  }
}
