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
import CustomAxisTickLabel from './customAxisTickLabel';

moment.tz.setDefault(defaultTimeZone);

interface IDataProps {
  label: string;
  color: string;
}

interface IDataPoint {
  timestampMillis: number;
  value: number | null;
  timestampMillisNormalized?: number;
}

interface IChartDataSet {
  color: string;
  label: string;
  coordinates: IDataPoint[];
  coordinatesUnfiltered: IDataPoint[];
  startTimeMillis: number;
  stepMillis: number;
  millisSetUnfiltered: number[];
  millisSetNormalized: number[];
}

interface ITimeSeriesState {
  tooltip: ITooltip;
  userBrushExtent: Date[] | null;
  showGroup?: { [group: string]: boolean };
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
    showGroup: {
      baseline: true,
      canary: true,
    },
  };

  private mainMinimapHeight: number = 320; //total height of the main & minimap (if applicable)

  private marginMain: IMargin = {
    top: 10,
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
    const { showGroup } = this.state;

    // If the group is filtered out, don't proceed
    if (!showGroup[properties.label]) return null;

    const stepMillis = scope.stepMillis;
    let dataPointsLength = values.length;
    let millisSetUnfiltered: number[] = [];
    let millisSetNormalized: number[] = [];
    let dataPoints = [] as IDataPoint[];

    Array(maxDataCount)
      .fill(0)
      .forEach((_: number, i: number) => {
        const ts = scope.startTimeMillis + i * stepMillis;
        millisSetUnfiltered.push(ts);
        const value = i < dataPointsLength && typeof values[i] === 'number' ? values[i] : undefined;

        const timestampMillisNormalized =
          !isStartTimeMillisEqual && showGroup.canary && showGroup.baseline && properties.label === 'canary'
            ? ts - startTimeMillisOffset
            : ts;
        if (typeof value === 'number') {
          millisSetNormalized.push(timestampMillisNormalized);
        }
        dataPoints.push({
          timestampMillis: ts,
          // normalize canary timestamp if startMillis are different and both are selected
          timestampMillisNormalized: timestampMillisNormalized,
          value,
        });
      });

    return {
      ...properties,
      coordinates: dataPoints.filter(d => typeof d.value === 'number'),
      coordinatesUnfiltered: dataPoints,
      startTimeMillis: scope.startTimeMillis,
      millisSetUnfiltered,
      millisSetNormalized,
    };
  };

  onLegendClickHandler = (group: string) => {
    const showGroup = this.state.showGroup;
    this.setState({
      showGroup: { ...showGroup, [group]: !showGroup[group] },
    });
  };

  // function factory to create a hover handler function based on the datasets
  createChartHoverHandler = (dataSets: IChartDataSet[], dataSetsAttr: IDataSetsAttribute) => {
    const { isStartTimeMillisEqual } = dataSetsAttr;

    return (d: any) => {
      if (d && d.timestampMillisNormalized) {
        const tooltipData = dataSets.map(
          (ds: IChartDataSet): ITooltipDataPoint => {
            const coord = ds.coordinatesUnfiltered.find(
              (c: IDataPoint) => c.timestampMillisNormalized === d.timestampMillisNormalized,
            );
            return {
              color: ds.color,
              label: ds.label,
              ts: coord.timestampMillis,
              value: coord.value,
            };
          },
        );

        let tooltipRows = tooltipData
          .sort((a: ITooltipDataPoint, b: ITooltipDataPoint) => b.value - a.value)
          .map((o: ITooltipDataPoint) => {
            // if there's a ts offset, timestamp should be displayed for each group
            const tsRow = isStartTimeMillisEqual ? null : (
              <div className={'tooltip-ts'}>{moment(o.ts).format('YYYY-MM-DD HH:mm:ss z')}</div>
            );
            return (
              <div key={o.label} className={isStartTimeMillisEqual ? '' : 'tooltip-dual-axis-row'}>
                {tsRow}
                <div id={o.label}>
                  <CircleIcon group={o.label} />
                  <span>{`${o.label}: `}</span>
                  <span>{utils.formatMetricValue(o.value)}</span>
                </div>
              </div>
            );
          });

        if (tooltipData.length === 2) {
          const canaryMinusBaseline = tooltipData[1].value - tooltipData[0].value;
          tooltipRows = tooltipRows.concat([
            <div id={'diff'} key={'diff'} className={'tooltip-row'}>
              <span>{`${'Canary - Baseline'}: `}</span>
              <span>{utils.formatMetricValue(canaryMinusBaseline)}</span>
            </div>,
          ]);
        }

        const tooltipContent = (
          <div>
            {/* if no dual axes, display timestamp row at the top level */}
            {isStartTimeMillisEqual ? (
              <div key={'ts'} className={'tooltip-ts'}>
                {moment(tooltipData[0].ts).format('YYYY-MM-DD HH:mm:ss z')}
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
  onBrushEnd = (e: Date[]) => {
    this.setState({
      userBrushExtent: e,
    });
  };

  render() {
    let { metricSetPair, parentWidth } = this.props;
    const { userBrushExtent, showGroup } = this.state;
    const {
      minimapDataPointsThreshold,
      axisTickLineHeight,
      axisTickLabelHeight,
      axisLabelHeight,
      minimapHeight,
    } = vizConfig.timeSeries;
    let graphTS;

    /*
    * Generate the data needed for the graph components
    */
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
    const dataSets = [baselineData, canaryData].filter(d => d) as IChartDataSet[];
    let xExtentMain = [] as number[];
    if (!userBrushExtent) {
      // Find all normalized timestamps where the value is a valid number
      // This is needed to derive the default xExtent for the main chart
      const timestampsNormalized = _.chain(dataSets)
        .map((d: IChartDataSet) => d.millisSetNormalized)
        .flatten()
        .value() as number[];
      xExtentMain = [Math.min(...timestampsNormalized), Math.max(...timestampsNormalized)];
    } else {
      const userBrushExtentMillis = userBrushExtent ? userBrushExtent.map((d: Date) => d.valueOf()) : null;
      xExtentMain = [userBrushExtentMillis[0], userBrushExtentMillis[1]];
    }

    const millisSetMain = dataSets[0]
      ? dataSets[0].millisSetUnfiltered.filter((ms: number) => ms >= xExtentMain[0] && ms <= xExtentMain[1])
      : [];

    const shouldDisplayMinimap = metricSetPair.values.control.length > minimapDataPointsThreshold;
    const shouldUseSecondaryXAxis = !dataSetsAttributes.isStartTimeMillisEqual && dataSets.length === 2;

    // if secondary axis is needed, we need more bottom margin to fit both axes
    const totalXAxisHeight = shouldUseSecondaryXAxis
      ? 2 * (axisTickLabelHeight + axisLabelHeight) + axisTickLineHeight
      : axisTickLabelHeight + axisLabelHeight;

    /*
    * Build the visualization components
    */
    const lineStyleFunc = (ds: IChartDataSet) => ({
      stroke: ds.color,
      strokeWidth: 2,
      strokeOpacity: 0.8,
    });
    const axesMain = [
      {
        orient: 'left',
        label: 'metric value',
        tickFormat: (d: number) => utils.formatMetricValue(d),
      },
      {
        orient: 'bottom',
        label: shouldUseSecondaryXAxis ? 'Baseline' : undefined,
        tickValues: utils.calculateDateTimeTicks(millisSetMain),
        tickFormat: (d: number) => <CustomAxisTickLabel millis={d} />,
        className: shouldUseSecondaryXAxis ? 'baseline-dual-axis' : '',
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

    const chartHoverHandler = this.createChartHoverHandler(dataSets, dataSetsAttributes);

    const commonTSConfig = {
      lines: dataSets,
      lineType: lineType,
      lineStyle: lineStyleFunc,
      xAccessor: (d: IDataPoint) => moment(d.timestampMillisNormalized).toDate(),
      yAccessor: 'value',
      xScaleType: scaleUtc(),
      baseMarkProps: { transitionDuration: { default: 200, fill: 200 } },
    };

    const mainTSFrameProps = {
      ...commonTSConfig,
      hoverAnnotation: hoverAnnotations,
      customHoverBehavior: chartHoverHandler,
      xExtent: xExtentMain.map((v: number) => new Date(v)),
      axes: axesMain,
      margin: { ...this.marginMain, bottom: totalXAxisHeight },
      matte: true,
    };

    let zoomIcon = null;
    if (shouldDisplayMinimap) {
      const axesMinimap = [
        {
          orient: 'left',
          tickFormat: (): void => null,
        },
        {
          orient: 'bottom',
        },
      ];
      const minimapSize = [parentWidth, minimapHeight];
      const minimapConfig = {
        ...commonTSConfig,
        yBrushable: false,
        brushEnd: this.onBrushEnd,
        size: minimapSize,
        axes: axesMinimap,
        // xBrushExtent: xExtentMillisTS,
        margin: this.marginMinimap,
      };

      zoomIcon = (
        <div className={'zoom-icon'}>
          <i className="fas fa-search-plus" />
        </div>
      );

      graphTS = (
        <MinimapXYFrame
          {...mainTSFrameProps}
          size={[parentWidth, this.mainMinimapHeight - minimapSize[1]]}
          minimap={minimapConfig}
        />
      );
    } else {
      graphTS = <XYFrame {...mainTSFrameProps} size={[parentWidth, this.mainMinimapHeight]} />;
    }

    const secondaryXAxis = shouldUseSecondaryXAxis ? (
      <SecondaryTSXAxis
        margin={{ left: this.marginMain.left, right: this.marginMain.right, top: 0, bottom: 0 }}
        width={parentWidth}
        millisSet={millisSetMain.map((ms: number) => ms + dataSetsAttributes.startTimeMillisOffset)}
        axisLabel={'canary'}
        bottomOffset={shouldDisplayMinimap ? minimapHeight : 0}
      />
    ) : null;

    let differenceArea = null;
    if (showGroup.baseline && showGroup.canary) {
      differenceArea = <DifferenceArea {...this.props} />;
    }

    return (
      <div className={'time-series'}>
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend showGroup={showGroup} isClickable={true} onClickHandler={this.onLegendClickHandler} />
        <div className={'graph-container'}>
          <div className={'time-series-chart'}>{graphTS}</div>
          {secondaryXAxis}
          <Tooltip {...this.state.tooltip} />
          {zoomIcon}
        </div>
        {differenceArea}
      </div>
    );
  }
}
