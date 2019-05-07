import { CurveFactory } from 'd3-shape';
import { ScaleTime } from 'd3-scale';

import { IMetricSetPairGraphProps } from '../metricSetPairGraph.service';

export interface ISemioticChartProps extends IMetricSetPairGraphProps {
  parentWidth: number;
}

export interface IMargin {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface ITooltip {
  content: JSX.Element;
  x: number;
  y: number;
}

export interface ISummaryStatistics {
  [prop: string]: ISummaryStatisticsValue;
}

export interface ISummaryStatisticsValue {
  value: number;
  label: string;
}

export interface ISemioticXYFrameProps<DataSet, DataPoint> {
  lines?: DataSet[];
  lineType?: { type: string; interpolator: CurveFactory };
  lineStyle?: (ds: DataSet) => Object;
  xAccessor?: string | ((d: DataPoint) => Date);
  yAccessor?: string | ((d: DataPoint) => number);
  xScaleType?: ScaleTime<number, number>;
  baseMarkProps?: Object;
  hoverAnnotation?: boolean | Array<Object | Function> | Object | Function;
  customHoverBehavior?: any;
  xExtent?: Array<Date> | Array<number>;
  axes?: Array<Object>;
  margin?: IMargin;
  matte?: boolean;
  size?: Array<number>;
  yBrushable?: boolean;
  brushEnd?: (d: Array<Date>) => void;
}

export interface ISemioticMinimapProps<DataSet, DataPoint> extends ISemioticXYFrameProps<DataSet, DataPoint> {
  minimap?: ISemioticXYFrameProps<DataSet, DataPoint>;
}

export interface ISemioticXYFrameHoverBaseArgs<DataPoint> {
  data?: DataPoint;
  points?: Array<DataPoint>;
  voronoiX?: number;
  voronoiY?: number;
  [key: string]: any;
}

export interface ISemioticOrdinalPiece<DataPoint> {
  base: number; // coordinate of the base along the y-axis
  value: number; // original value of the data point
  scaledValue: number; // value in pixels
  data: DataPoint;
  [key: string]: any;
}

export interface ISemioticOrdinalXyData<DataPoint> {
  o: string; // ordinal label for this data
  xy: {
    height: number; //height of the data point svg along the y axis
    width: number; // width of the data point svg (e.g. bar width)
    x: number; // starting x coordinate of the drawn data svg
    y: number; // starting y coordinate of the drawn data svg

    // center coordinate of the data point svg along the main (x) axis
    // relative to x
    middle: number;
  };
  piece: ISemioticOrdinalPiece<DataPoint>;
  [key: string]: any;
}

export interface ISemioticOrdinalGroup<DataPoint> {
  middle: number; // absolute position of the center of the column along the main axis
  name: string; // ordinal label
  padding: number;
  width: number; // width of the column
  x: number; // starting position of the column (along the main axis)
  xyData: Array<ISemioticOrdinalXyData<DataPoint>>;
  y: number;
  [key: string]: any;
}

export interface ISemioticOrdinalSummaryPiece {
  isSummaryData: boolean;
  key: string; // data group (i.e. baseline or canary)
  label: string;
  summaryPieceName: string;
  type: string; // type of hover event (e.g. frame-hover)
  value: number;
  x: number;
  y: number;
}

export interface ISemioticOrdinalFrameHoverArgs<DataPoint> {
  column?: ISemioticOrdinalGroup<DataPoint>; //used
  summary?: Array<ISemioticOrdinalPiece<DataPoint>>; //used
  type?: string; // type of hover event (e.g. frame-hover)
  points: undefined | Array<ISemioticOrdinalSummaryPiece>; //used
  voronoiX?: number;
  voronoiY?: number;
  [key: string]: any;
}

export interface ISemioticAnnotationArgs<AnnotationData, CategoryData> {
  d: AnnotationData; // user-defined custom annotation data
  i: number; // index
  categories: {
    [label: string]: CategoryData;
  };
  [key: string]: any;
}
