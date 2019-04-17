///<reference path="./declarations/semiotic.d.ts" />

import * as React from 'react';
import { scaleUtc } from 'd3-scale';
import { Axis } from 'semiotic';

import { IMargin } from './semiotic.service';
import * as utils from './utils';
import CustomAxisTickLabel from './customAxisTickLabel';
import './secondaryTSXAxis.less';

// interface IDataPoint {
//   timestampMillis: number;
//   value: number;
// }
//
// interface IChartDataSet {
//   label: string;
//   color: string;
//   coordinates: IDataPoint[];
// }
//
interface ISecondaryTSXAxisProps {
  margin: IMargin;
  width: number;
  axisTickLineHeight: number;
  millisSet: number[];
  axisLabel?: string;
  axisTickLabelHeight: number;
  axisLabelHeight: number;
}

/*
* Secondary X Axis for Time Series Graph
* Used when canary and baseline have different start time. We can overlay this axis component
* on the main graph component
*/
export default class secondaryTSXAxis extends React.Component<ISecondaryTSXAxisProps> {
  static defaultProps: ISecondaryTSXAxisProps = {
    margin: {
      top: 0,
      bottom: 0,
      left: 60,
      right: 20,
    },
    width: 200, // total width for this component
    axisTickLineHeight: 4, // height of the tick lines above the axis line
    millisSet: [0],
    axisTickLabelHeight: 32,
    axisLabelHeight: 16,
  };

  public render() {
    const {
      margin,
      width,
      axisTickLabelHeight,
      axisTickLineHeight,
      millisSet,
      axisLabel,
      axisLabelHeight,
    } = this.props;

    const extent = [millisSet[0], millisSet[millisSet.length - 1]].map((ms: number) => new Date(ms));
    const totalAxisHeight = axisTickLabelHeight + axisTickLineHeight + (axisLabel ? axisLabelHeight : 0);
    const netWidth = width - margin.left - margin.right;
    const range = [0, netWidth];
    const containerStyle = {
      margin: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`,
    };

    return (
      <div className={'secondary-ts-x-axis'} style={containerStyle}>
        <svg className={'axis'} width={netWidth} height={totalAxisHeight}>
          <Axis
            className={'x axis bottom'}
            size={[netWidth, axisTickLineHeight]}
            scale={scaleUtc()
              .domain(extent)
              .range(range)}
            orient={'bottom'}
            label={'canary'}
            tickValues={utils.calculateDateTimeTicks(millisSet)}
            tickFormat={(d: number) => <CustomAxisTickLabel millis={d} />}
          />
        </svg>
      </div>
    );
  }
}
