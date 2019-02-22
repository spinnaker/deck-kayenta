///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { scaleUtc } from 'd3-scale';
import { extent } from 'd3-array';
import { MinimapXYFrame } from 'semiotic';
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
  tooltip: any;
  userBrushExtent: any;
}

export default class TimeSeries extends React.Component<ISemioticChartProps, ITimeSeriesState> {
  state: ITimeSeriesState = {
    tooltip: null,
    userBrushExtent: null,
  };

  private margin: IMargin = {
    top: 10,
    bottom: 40,
    left: 40,
    right: 10,
  };

  componentDidUpdate() {}

  formatTSData = (values: number[], scope: IMetricSetScope, properties: object) => {
    const stepMillis = scope.stepMillis;
    let dataPoints = values
      .map((v, i) => {
        return {
          timestampMillis: scope.startTimeMillis + i * stepMillis,
          value: typeof v === 'number' ? v : null,
        };
      })
      .filter(d => d.value);
    return {
      ...properties,
      coordinates: dataPoints,
    };
  };

  createChartHoverHandler = (dataSets: IChartDataSet[]) => {
    return (d: any) => {
      const { config } = this.props;
      if (d) {
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
            <div>{moment(d.data.timestampMillis).format('YYYY-MM-DD HH:mm:ss z')}</div>
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
  };

  onBrushEnd = (e: any) => {
    this.setState({
      userBrushExtent: e,
    });
  };

  render(): any {
    console.log('TimeSeries...');
    console.log(this.props);
    const { metricSetPair, config, parentWidth } = this.props;
    const { userBrushExtent } = this.state;

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
    const tsExtent = extent(baselineData.coordinates.map(c => c.timestampMillis));

    /* data format
      [
        {
          attribute1: val1,
          attribute2: val2,
          coordinates: [
            { timestampMillis: 129393812093, value: 0}
          ]
        }
      ]
    */

    const lineStyleFunc = (ds: IChartDataSet) => {
      return {
        stroke: ds.color,
        strokeWidth: 2,
        strokeOpacity: 0.8,
      };
    };

    const axes = [
      {
        orient: 'left',
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

    const sharedConfig = {
      lines: data,
      lineType: lineType,
      lineStyle: lineStyleFunc,
      xAccessor: (d: IDataPoint) => moment(d.timestampMillis).toDate(),
      yAccessor: 'value',
    };

    const minimapSize = [parentWidth, 60];
    const minimapConfig = {
      ...sharedConfig,
      xScaleType: scaleUtc(),
      yBrushable: false,
      brushEnd: this.onBrushEnd,
      size: minimapSize,
      xBrushExtent: tsExtent,
      margin: {
        top: 6,
        bottom: 6,
        left: 45,
        right: 10,
      },
    };
    const chartHoverHandler = this.createChartHoverHandler(data);

    const graph = (
      <MinimapXYFrame
        {...sharedConfig}
        xScaleType={scaleUtc()}
        size={[parentWidth, config.height - minimapSize[1]]}
        hoverAnnotation={hoverAnnotations}
        customHoverBehavior={chartHoverHandler}
        minimap={minimapConfig}
        xExtent={xExtentMainFrame}
        axes={axes}
        margin={this.margin}
        matte={true}
      />
    );

    return (
      <div className={'graph-container'}>
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend />
        <div className={'time-series-chart'}>{graph}</div>
        <Tooltip {...this.state.tooltip} />
        <div className={'zoom-icon'}>
          <i className="fas fa-search-plus" />
        </div>
      </div>
    );
  }
}
