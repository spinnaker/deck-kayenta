import * as React from 'react';
import { scaleUtc } from 'd3-scale';
import { MinimapXYFrame, XYFrame } from 'semiotic';
import * as moment from 'moment-timezone';
import { SETTINGS } from '@spinnaker/core';
const { defaultTimeZone } = SETTINGS;
import { curveStepAfter } from 'd3-shape';
// import { IMetricSetScope } from 'kayenta/domain/IMetricSetPair';
// import * as _ from 'lodash';

import * as utils from './utils';
import Tooltip from './tooltip';
import ChartHeader from './chartHeader';
import ChartLegend from './chartLegend';
import {
  ISemioticChartProps,
  IMargin,
  ITooltip,
  ISemioticXYFrameProps,
  ISemioticMinimapProps,
  ISemioticXYFrameHoverBaseArgs,
} from './semiotic.service';
import './timeSeries.less';
import { vizConfig } from './config';
import CircleIcon from './circleIcon';
import DifferenceArea from './differenceArea';
import SecondaryTSXAxis from './secondaryTSXAxis';
import CustomAxisTickLabel from './customAxisTickLabel';

moment.tz.setDefault(defaultTimeZone);

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
}

interface IChartData {
  dataSets: IChartDataSet[];
  xExtentMain: number[];
  millisSetMain: number[];
}

interface ITimeSeriesState {
  tooltip: ITooltip;
  userBrushExtent: Date[] | null;
  showGroup: { [group: string]: boolean };
  graphs: { [graph: string]: JSX.Element };
}

interface ITooltipDataPoint {
  color: string;
  label: string;
  value: number | null;
  ts: number;
}

interface IdataSetsAttributes {
  isStartTimeMillisEqual: boolean;
  startTimeMillisOffset: number;
  maxDataCount: number;
  shouldDisplayMinimap: boolean;
  shouldUseSecondaryXAxis: boolean;
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
    graphs: {
      //a standalone timeseries chart if data points are few, otherwise it also includes a brushable/ zoomable minimap
      line: null,
      //graph that shows the delta between canary and baseline
      differenceArea: null,
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

  componentDidMount = () => {
    this.createGraphs();
  };

  componentDidUpdate = (prevProps: ISemioticChartProps, prevState: ITimeSeriesState) => {
    let { metricSetPair, parentWidth } = this.props;
    const { userBrushExtent, showGroup } = this.state;
    if (
      metricSetPair !== prevProps.metricSetPair ||
      parentWidth !== prevProps.parentWidth ||
      userBrushExtent !== prevState.userBrushExtent ||
      showGroup !== prevState.showGroup
    ) {
      this.createGraphs();
    }
  };

  // Min & Max Millis determined by user brush extent (if defined), else
  // derived from the first & last valid (non-"NaN") value
  getXExtent = (millisSet: number[]) => {
    const { userBrushExtent } = this.state;
    if (!userBrushExtent) {
      return [Math.min(...millisSet), Math.max(...millisSet)];
    } else {
      return userBrushExtent.map((d: Date) => d.valueOf());
    }
  };

  /*
  *  Generate chart Data
  * In cases where the start Millis is different betwen canary and baseline, we want to:
  * 1) If data point count is different, extend the shorter dataset to match the longer one (i.e. match the x extent)
  * 2) normalize canary timestamp to match baseline timestamps (needed for the tooltip's
  * voronoi overlay logic in semiotic to work properly)
  */
  getChartData = (dataSetsAttr: IdataSetsAttributes) => {
    const { startTimeMillisOffset, maxDataCount, shouldUseSecondaryXAxis } = dataSetsAttr;

    const { showGroup } = this.state;
    const { metricSetPair } = this.props;
    const { dataGroupMap, colors } = vizConfig;

    // Set of all millis (normalized to baseline)
    const millisSetMainUnfiltered: number[] = [];
    const millisSetMainFiltered: Set<number> = new Set();

    const dataSets: IChartDataSet[] = ['baseline', 'canary']
      .filter((g: string) => showGroup[g])
      .map((g: string, gi: number) => {
        const scope = metricSetPair.scopes[dataGroupMap[g]];
        const values = metricSetPair.values[dataGroupMap[g]];
        const stepMillis = scope.stepMillis;
        let dataPointsLength = values.length;

        // Iterate based on max data count to handle cases where baseline and canary have different data point counts
        // This ensures both primary and secondary x axis have consistent extents so there'll be no missing tick labels
        const dataPoints = Array(maxDataCount)
          .fill(0)
          .map((_: number, i: number) => {
            const ts = scope.startTimeMillis + i * stepMillis;
            gi === 0 ? millisSetMainUnfiltered.push(ts) : null;
            const value = i < dataPointsLength && typeof values[i] === 'number' ? values[i] : undefined;
            if (typeof value === 'number') {
              millisSetMainFiltered.add(ts);
            }
            // If dual axis is needed, shift canary ts to align with baseline
            const timestampMillisNormalized =
              shouldUseSecondaryXAxis && g === 'canary' ? ts - startTimeMillisOffset : ts;

            return {
              timestampMillis: ts,
              // normalize canary timestamp if startMillis are different and both are selected
              timestampMillisNormalized: timestampMillisNormalized,
              value,
            };
          });

        return {
          label: g,
          color: colors[g],
          coordinates: dataPoints.filter(d => typeof d.value === 'number'),
          coordinatesUnfiltered: dataPoints,
          startTimeMillis: scope.startTimeMillis,
        };
      });

    // Extent (i.e. min & max) of millisSetMainTrimmed
    const xExtentMain = this.getXExtent([...millisSetMainFiltered]);

    return {
      dataSets, // actual dataset supplied to semiotic,
      xExtentMain,
      millisSetMain: millisSetMainUnfiltered.filter((ms: number) => ms >= xExtentMain[0] && ms <= xExtentMain[1]),
    };
  };

  createCommonChartProps = (dataSets: IChartDataSet[]) => {
    return {
      lines: dataSets,
      lineType: {
        type: 'line',
        interpolator: curveStepAfter,
      },
      lineStyle: (ds: IChartDataSet) => ({
        stroke: ds.color,
        strokeWidth: 2,
        strokeOpacity: 0.8,
      }),
      xAccessor: (d: IDataPoint) => moment(d.timestampMillisNormalized).toDate(),
      yAccessor: 'value',
      xScaleType: scaleUtc(),
      baseMarkProps: { transitionDuration: { default: 200, fill: 200 } },
    };
  };

  createLineChartProps = (
    chartData: IChartData,
    dataSetsAttributes: IdataSetsAttributes,
    commonChartProps: ISemioticXYFrameProps<IChartDataSet, IDataPoint>,
  ) => {
    const { axisTickLineHeight, axisTickLabelHeight, axisLabelHeight, minimapHeight } = vizConfig.timeSeries;

    const { parentWidth } = this.props;

    const { shouldUseSecondaryXAxis, shouldDisplayMinimap } = dataSetsAttributes;
    const { dataSets, xExtentMain, millisSetMain } = chartData;

    // if secondary axis is needed, we need more bottom margin to fit both axes
    const totalXAxisHeight = shouldUseSecondaryXAxis
      ? 2 * (axisTickLabelHeight + axisLabelHeight) + axisTickLineHeight
      : axisTickLabelHeight;

    const lineChartProps = {
      ...commonChartProps,
      hoverAnnotation: [
        {
          type: 'x',
          disable: ['connector', 'note'],
        },
        {
          type: 'vertical-points',
          threshold: 0.1,
          r: () => 5,
        },
      ],
      customHoverBehavior: this.createChartHoverHandler(dataSets, dataSetsAttributes),
      xExtent: xExtentMain.map((v: number) => new Date(v)),
      axes: [
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
      ],
      margin: { ...this.marginMain, bottom: totalXAxisHeight },
      matte: true,
      size: [parentWidth, shouldDisplayMinimap ? this.mainMinimapHeight - minimapHeight : this.mainMinimapHeight],
    };

    if (shouldDisplayMinimap) {
      return {
        ...lineChartProps,
        minimap: {
          ...commonChartProps,
          yBrushable: false,
          brushEnd: this.onBrushEnd,
          size: [parentWidth, minimapHeight],
          axes: [
            {
              orient: 'left',
              tickFormat: (): void => null,
            },
            {
              orient: 'bottom',
            },
          ],
          margin: this.marginMinimap,
        } as ISemioticMinimapProps<IChartDataSet, IDataPoint>,
      };
    } else return lineChartProps as ISemioticXYFrameProps<IChartDataSet, IDataPoint>;
  };

  createGraphs = () => {
    const { metricSetPair, parentWidth } = this.props;
    const { showGroup } = this.state;
    const { minimapDataPointsThreshold, minimapHeight } = vizConfig.timeSeries;

    /*
    * Generate the data needed for the graph components
    */
    const baselineStartTimeMillis = metricSetPair.scopes.control.startTimeMillis;
    const canaryStartTimeMillis = metricSetPair.scopes.experiment.startTimeMillis;
    const isStartTimeMillisEqual = baselineStartTimeMillis === canaryStartTimeMillis;

    // Top level attributes to determine how data is formatted & which chart components to include
    const dataSetsAttributes = {
      isStartTimeMillisEqual: isStartTimeMillisEqual,
      startTimeMillisOffset: canaryStartTimeMillis - baselineStartTimeMillis,
      maxDataCount: Math.max(metricSetPair.values.control.length, metricSetPair.values.experiment.length),
      shouldDisplayMinimap: metricSetPair.values.control.length > minimapDataPointsThreshold,
      shouldUseSecondaryXAxis: !isStartTimeMillisEqual && showGroup.canary && showGroup.baseline,
    };

    const chartData = this.getChartData(dataSetsAttributes);

    /*
    * Build the visualization components
    */
    const commonChartProps = this.createCommonChartProps(chartData.dataSets);
    const lineChartProps = this.createLineChartProps(chartData, dataSetsAttributes, commonChartProps);

    const line = (
      <>
        <div className="time-series-chart">
          {dataSetsAttributes.shouldDisplayMinimap ? (
            <MinimapXYFrame {...lineChartProps} />
          ) : (
            <XYFrame {...lineChartProps} />
          )}
        </div>
        {dataSetsAttributes.shouldUseSecondaryXAxis ? (
          <SecondaryTSXAxis
            margin={{ left: this.marginMain.left, right: this.marginMain.right, top: 0, bottom: 0 }}
            width={parentWidth}
            millisSet={chartData.millisSetMain.map((ms: number) => ms + dataSetsAttributes.startTimeMillisOffset)}
            axisLabel={'canary'}
            bottomOffset={dataSetsAttributes.shouldDisplayMinimap ? minimapHeight : 0}
          />
        ) : null}
        {dataSetsAttributes.shouldDisplayMinimap ? (
          <div className="zoom-icon">
            <i className="fas fa-search-plus" />
          </div>
        ) : null}
      </>
    );

    const differenceArea = showGroup.baseline && showGroup.canary ? <DifferenceArea {...this.props} /> : null;

    this.setState({
      graphs: {
        line: line,
        differenceArea: differenceArea,
      },
    });
  };

  onLegendClickHandler = (group: string) => {
    const showGroup = this.state.showGroup;
    this.setState({
      showGroup: { ...showGroup, [group]: !showGroup[group] },
    });
  };

  // function factory to create a hover handler function based on the datasets
  createChartHoverHandler = (dataSets: IChartDataSet[], dataSetsAttr: IdataSetsAttributes) => {
    const { isStartTimeMillisEqual } = dataSetsAttr;

    return (d: (ISemioticXYFrameHoverBaseArgs<IDataPoint> & IDataPoint) | undefined) => {
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
    const { metricSetPair } = this.props;
    const { showGroup, tooltip } = this.state;
    const { line, differenceArea } = this.state.graphs;

    return (
      <div className="time-series">
        <ChartHeader metric={metricSetPair.name} />
        <ChartLegend showGroup={showGroup} isClickable={true} onClickHandler={this.onLegendClickHandler} />
        <div className="graph-container">
          {line}
          <Tooltip {...tooltip} />
        </div>
        {differenceArea}
      </div>
    );
  }
}
