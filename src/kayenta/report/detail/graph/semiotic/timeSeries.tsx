///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { scaleUtc } from 'd3-scale';
// import { extent } from 'd3-array';
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
import { ISemioticChartProps, IMargin } from './semiotic.service';
import './graph.less';
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

interface ITooltip {
  content: JSX.Element;
  x: number;
  y: number;
}

interface ITimeSeriesState {
  tooltip: ITooltip;
  userBrushExtent: number[];
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

  private margin: IMargin = {
    top: 10,
    bottom: 24,
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

  createChartHoverHandler = (dataSets: IChartDataSet[]) => {
    return (d: any) => {
      if (d && d.timestampMillis) {
        const timestampMillis = d.timestampMillis;
        const tooltipRows = dataSets
          .map(ds => {
            const dataPoint = ds.coordinates.find(o => o.timestampMillis === timestampMillis);
            return {
              color: ds.color,
              label: ds.label,
              value: dataPoint ? utils.formatMetricValue(dataPoint.value) : null,
            };
          })
          .sort((a: any, b: any) => b.value - a.value)
          .map((o: any) => {
            return (
              <div id={o.label} key={o.label}>
                <CircleIcon group={o.label} />
                <span>{`${o.label}: `}</span>
                <span>{o.value}</span>
              </div>
            );
          });

        const tooltipContent = (
          <div>
            <div>{moment(d.data.timestampMillis).format('YYYY-MM-DD HH:mm:ss z')}</div>
            {tooltipRows}
          </div>
        );

        this.setState({
          tooltip: {
            content: tooltipContent,
            x: d.voronoiX + this.margin.left,
            y: d.voronoiY + this.margin.top,
          },
        });
      } else this.setState({ tooltip: null });
    };
  };

  //Handle user brush action
  onBrushEnd = (e: any) => {
    this.setState({
      userBrushExtent: e,
    });
  };

  render() {
    const { metricSetPair, parentWidth } = this.props;
    const { userBrushExtent } = this.state;
    const { minimapDataPointsThreshold, differenceAreaHeight, differenceAreaHeaderHeight } = vizConfig.timeSeries;
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
    const tsExtent = [
      startTimeMillis,
      startTimeMillis + (metricSetPair.values.control.length - 1) * metricSetPair.scopes.control.stepMillis,
    ];
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
        ticks: 8,
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

    const xExtentMainFrame = userBrushExtent ? userBrushExtent : [new Date(tsExtent[0]), new Date(tsExtent[1])];
    const chartHoverHandler = this.createChartHoverHandler(data);

    const commonTSConfig = {
      lines: data,
      lineType: lineType,
      lineStyle: lineStyleFunc,
      xAccessor: (d: IDataPoint) => moment(d.timestampMillis).toDate(),
      yAccessor: 'value',
    };

    const mainTSFrameProps = Object.assign({}, commonTSConfig, {
      xScaleType: scaleUtc(),
      hoverAnnotation: hoverAnnotations,
      customHoverBehavior: chartHoverHandler,
      xExtent: xExtentMainFrame,
      axes: axesMain,
      margin: this.margin,
      matte: true,
    });

    if (shouldDisplayMinimap) {
      const axesMinimap = [
        {
          orient: 'left',
          tickFormat: (): void => null,
        },
        {
          orient: 'bottom',
          ticks: 8,
        },
      ];

      const minimapSize = [parentWidth, 40];
      const minimapConfig = {
        ...commonTSConfig,
        xScaleType: scaleUtc(),
        yBrushable: false,
        brushEnd: this.onBrushEnd,
        size: minimapSize,
        axes: axesMinimap,
        xBrushExtent: tsExtent,
        margin: {
          top: 0,
          bottom: 0,
          left: 60,
          right: 20,
        },
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
      <div>
        <ChartHeader metric={metricSetPair.name} />
        <div className={'chart-title'}>{'Time Series'}</div>
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
        <DifferenceArea {...this.props} height={differenceAreaHeight} />
      </div>
    );
  }
}
