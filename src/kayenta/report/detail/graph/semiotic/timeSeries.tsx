///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { scaleUtc } from 'd3-scale';
import { MinimapXYFrame, XYFrame } from 'semiotic';
import * as moment from 'moment-timezone';
import { SETTINGS } from '@spinnaker/core';
const { defaultTimeZone } = SETTINGS;
import { curveStepAfter } from 'd3-shape';
import { IMetricSetScope } from 'kayenta/domain/IMetricSetPair';
import * as _ from 'lodash';

import * as utils from './utils';
import Tooltip from './tooltip';
import ChartHeader from './chartHeader';
import ChartLegend from './chartLegend';
import { ISemioticChartProps, IMargin, ITooltip } from './semiotic.service';
import './timeSeries.less';
import { vizConfig } from './config';
import CircleIcon from './circleIcon';
import DifferenceArea from './differenceArea';
import SecondaryTSXAxis from './secondaryTSXAxis';

moment.tz.setDefault(defaultTimeZone);

interface IDataProps {
  label: string;
  color: string;
}

interface IDataPoint {
  timestampMillis: number;
  value: number | null;
  normalizedTimestampMillis?: number;
}

interface IChartDataSet {
  color: string;
  label: string;
  coordinates: IDataPoint[];
  // dataPointCount: number,
  startTimeMillis: number;
  endTimeMillis: number;
  stepMillis: number;
  millisSet: number[];
}

interface ITimeSeriesState {
  tooltip: ITooltip;
  userBrushExtent: number[];
}

interface ITooltipDataPoint {
  color: string;
  label: string;
  value: number | null;
  ts: number;
}

interface IDataSetsAttribute {
  isStartTimeMillisEqual: boolean;
  startTimeMillisOffset: number;
  maxDataCount: number;
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

  /*
  *  Generate chart Data
  * In cases where the start Millis is different betwen canary and baseline, we want to:
  * 1) If data point count is different, extend the shorter dataset to match the longer one (i.e. match the x extent)
  * 2) normalize canary timestamp to match baseline timestamps (needed for the tooltip's
  * voronoi overlay logic in semiotic to work properly)
  */
  formatTSData = (
    values: number[],
    scope: IMetricSetScope,
    properties: IDataProps,
    dataSetsAttr: IDataSetsAttribute,
  ) => {
    const { isStartTimeMillisEqual, startTimeMillisOffset, maxDataCount } = dataSetsAttr;

    const stepMillis = scope.stepMillis;
    let millisSet: number[] = [];
    let dataPointsLength = values.length;
    let dataPoints = Array(maxDataCount)
      .fill(0)
      .map((_: number, i: number) => {
        const ts = scope.startTimeMillis + i * stepMillis;
        const value = i < dataPointsLength ? values[i] : null;
        millisSet.push(ts);
        return {
          timestampMillis: ts,
          // if canary has an offset, shift it back to match with baseline
          normalizedTimestampMillis:
            !isStartTimeMillisEqual && properties.label === 'canary' ? ts - startTimeMillisOffset : ts,
          value: typeof value === 'number' ? value : null,
        };
      });

    return {
      ...properties,
      coordinates: dataPoints.filter(d => typeof d.value === 'number'),
      // filteredCoordinates : dataPoints,
      // dataPointCount: dataPoints.length,
      startTimeMillis: scope.startTimeMillis,
      endTimeMillis: scope.startTimeMillis + (dataPoints.length - 1) * stepMillis,
      stepMillis,
      millisSet,
    };
  };

  calculateDifferenceChartData = () => {};

  // function factory to create a hover handler function based on the datasets
  createChartHoverHandler = (dataSets: IChartDataSet[], dataSetsAttr: IDataSetsAttribute) => {
    const { isStartTimeMillisEqual } = dataSetsAttr;
    return (d: any) => {
      if (d && d.normalizedTimestampMillis) {
        const tsBaseline = d.normalizedTimestampMillis;
        const tsCanary = tsBaseline + dataSetsAttr.startTimeMillisOffset;
        const dataPoints: { [group: string]: IDataPoint | undefined } = {
          canary: dataSets.find(o => o.label === 'canary').coordinates.find(c => c.timestampMillis === tsCanary),
          baseline: dataSets.find(o => o.label === 'baseline').coordinates.find(c => c.timestampMillis === tsBaseline),
        };

        const canaryMinusBaseline =
          dataPoints.canary && dataPoints.baseline ? dataPoints.canary.value - dataPoints.baseline.value : null;

        const tooltipRows = dataSets
          .map(
            (ds: IChartDataSet): ITooltipDataPoint => {
              console.log(ds);
              console.log(ds.label === 'baseline' ? tsBaseline : tsCanary);
              return {
                color: ds.color,
                label: ds.label,
                value: dataPoints[ds.label] ? dataPoints[ds.label].value : null,
                ts: ds.label === 'baseline' ? tsBaseline : tsCanary,
              };
            },
          )
          .sort((a: ITooltipDataPoint, b: ITooltipDataPoint) => b.value - a.value)
          .map((o: ITooltipDataPoint) => {
            // if there's an ts offset, timestamp should be displayed for each group
            const tsRow = isStartTimeMillisEqual ? null : (
              <div className={'tooltip-ts'}>{moment(o.ts).format('YYYY-MM-DD HH:mm:ss z')}</div>
            );
            return (
              <div className={isStartTimeMillisEqual ? '' : 'tooltip-dual-axis-row'}>
                {tsRow}
                <div id={o.label} key={o.label}>
                  <CircleIcon group={o.label} />
                  <span>{`${o.label}: `}</span>
                  <span>{utils.formatMetricValue(o.value)}</span>
                </div>
              </div>
            );
          })
          .concat([
            <div id={'diff'} key={'diff'} className={'tooltip-row'}>
              <span>{`${'Canary - Baseline'}: `}</span>
              <span>{utils.formatMetricValue(canaryMinusBaseline)}</span>
            </div>,
          ]);
        const tooltipContent = (
          <div>
            {/* if no dual axes, display timestamp row at the top level */}
            {isStartTimeMillisEqual ? (
              <div key={'ts'} className={'tooltip-ts'}>
                {moment(tsBaseline).format('YYYY-MM-DD HH:mm:ss z')}
              </div>
            ) : null}
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
    let { metricSetPair, parentWidth } = this.props;
    const { userBrushExtent } = this.state;
    const {
      minimapDataPointsThreshold,
      differenceAreaHeight,
      differenceAreaHeaderHeight,
      minimapHeight,
    } = vizConfig.timeSeries;
    let graphTS;

    const totalDifferenceAreaSectionHeight = differenceAreaHeight + differenceAreaHeaderHeight;

    // Test data
    const testOffset = 240000 + 18000000;
    metricSetPair = _.cloneDeep(metricSetPair);
    metricSetPair.scopes.experiment.startTimeMillis = metricSetPair.scopes.experiment.startTimeMillis + testOffset;
    Object.values(metricSetPair.values.experiment).forEach((d: any) => {
      d = d + testOffset;
    });

    console.log('metricSetPair+++');
    console.log(metricSetPair);

    const isStartTimeMillisEqual =
      metricSetPair.scopes.control.startTimeMillis === metricSetPair.scopes.experiment.startTimeMillis;
    const baselineStartTimeMillis = metricSetPair.scopes.control.startTimeMillis;
    const canaryStartTimeMillis = metricSetPair.scopes.experiment.startTimeMillis;
    const dataSetsAttributes = {
      isStartTimeMillisEqual: baselineStartTimeMillis === canaryStartTimeMillis,
      startTimeMillisOffset: canaryStartTimeMillis - baselineStartTimeMillis,
      maxDataCount: Math.max(metricSetPair.values.control.length, metricSetPair.values.experiment.length),
    };
    const baselineDataProps: IDataProps = {
      color: vizConfig.colors.baseline,
      label: 'baseline',
    };
    const baselineData = this.formatTSData(
      metricSetPair.values.control,
      metricSetPair.scopes.control,
      baselineDataProps,
      dataSetsAttributes,
    );
    const canaryDataProps: IDataProps = {
      color: vizConfig.colors.canary,
      label: 'canary',
    };
    const canaryData = this.formatTSData(
      metricSetPair.values.experiment,
      metricSetPair.scopes.experiment,
      canaryDataProps,
      dataSetsAttributes,
    );
    const data = [baselineData, canaryData] as IChartDataSet[];
    // TODO: calculate differenceChartData

    const millisSet = baselineData.millisSet;
    const extentTS = [baselineData.startTimeMillis, baselineData.endTimeMillis];

    // If there's no user extent defined, set the entire extent as the default for the main chart
    const xExtentMain = userBrushExtent ? userBrushExtent : [new Date(extentTS[0]), new Date(extentTS[1])];
    const millisSetMain = millisSet.filter((ms: number) => ms >= xExtentMain[0] && ms <= xExtentMain[1]);
    const millisSetMainCanary = dataSetsAttributes.isStartTimeMillisEqual
      ? millisSetMain
      : millisSetMain.map((ms: number) => ms + dataSetsAttributes.startTimeMillisOffset);
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

    const chartHoverHandler = this.createChartHoverHandler(data, dataSetsAttributes);

    const commonTSConfig = {
      lines: data,
      lineType: lineType,
      lineStyle: lineStyleFunc,
      xAccessor: (d: IDataPoint) => moment(d.normalizedTimestampMillis).toDate(),
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

    // const shouldUseDualAxis = !isStartTimeMillisEqual && baselineData.coordinates.length>0
    //   && canaryData.coordinates.length>0
    // console.log('shouldUseDualAxis+++')
    // console.log(shouldUseDualAxis)

    const secondaryXAxis =
      !isStartTimeMillisEqual && baselineData.coordinates.length > 0 && canaryData.coordinates.length > 0 ? (
        <SecondaryTSXAxis
          margin={{ left: this.marginMain.left, right: this.marginMain.right, top: 0, bottom: 0 }}
          width={parentWidth}
          axisTickLineHeight={4}
          millisSet={millisSetMainCanary}
          axisTickLabelHeight={32}
          axisLabelHeight={16}
          axisLabel={'canary'}
        />
      ) : null;

    return (
      <div className={'time-series'}>
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend />
        <div className={'graph-container'}>
          <div className={'time-series-chart'}>{graphTS}</div>
          {secondaryXAxis}
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
