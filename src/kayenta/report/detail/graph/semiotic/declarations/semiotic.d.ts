declare module 'semiotic' {
  import { CurveFactory } from 'd3-shape';
  import { ScaleTime } from 'd3-scale';

  export class XYFrame extends React.Component {}
  export class MinimapXYFrame extends React.Component {}
  export class OrdinalFrame extends React.Component {}
  export class Annotation extends React.Component<ICustomAnnotationProps> {}
  export class Axis extends React.Component<IAxisProps> {}

  export type ISemioticAnnotationType = {
    type?: string | Function;
    column?: { name: string };
    facetColumn?: string;
    // bounds?: RawPoint[]
    x?: number;
    y?: number;
    yTop?: number;
    yBottom?: number;
    yMiddle?: number;
    coordinates?: object[];
    key?: string;
    percent?: number;
    style?: any;
    // style?:
    //   | GenericObject
    //   | ((arg?: GenericObject, index?: number) => GenericObject)
    ids?: string[];
    edge?: boolean;
    // source?: NodeType
    // target?: NodeType
    id?: string;
    element?: Element;
    label?: string | Element;
    neighbors?: object[];
  };

  // export type ISemioticCustomHoverType =
  //   | boolean
  //   | Array<AnnotationType | Function>
  //   | object
  //   | Function

  export interface ISemioticXYFrameProps<DataSet, DataPoint> {
    lines?: DataSet[];
    lineType?: { type: string; interpolator: CurveFactory };
    lineStyle?: (ds: DataSet) => Object;
    xAccessor?: string | ((d: DataPoint) => Date);
    yAccessor?: string | ((d: DataPoint) => number);
    xScaleType?: ScaleTime<number, number>;
    baseMarkProps?: Object;
    hoverAnnotation?: boolean | (Object | Function)[] | Object | Function;
    customHoverBehavior?: any;
    xExtent?: Date[] | number[];
    axes?: Object[];
    margin?: IMargin;
    matte?: boolean;
    size?: number[];
    yBrushable?: boolean;
    brushEnd?: (d: Date[]) => void;
  }

  export interface ISemioticMinimapProps<DataSet, DataPoint> extends ISemioticXYFrameProps<DataSet, DataPoint> {
    minimap?: ISemioticXYFrameProps<DataSet, DataPoint>;
  }

  export interface ISemioticXYFrameHoverBaseArgs<DataPoint> {
    data?: DataPoint;
    points?: DataPoint[];
    voronoiX?: number;
    voronoiY?: number;
    [key: string]: any;
  }

  export interface ISemioticOrPiece<DataPoint> {
    base: number; // coordinate of the base along the y-axis
    value: number; // original value of the data point
    scaledValue: number; // value in pixels
    data: DataPoint;
    [key: string]: any;
  }

  export interface ISemioticOrXyData<DataPoint> {
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
    piece: ISemioticOrPiece<DataPoint>;
    [key: string]: any;
  }

  export interface ISemioticOrGroup<DataPoint> {
    middle: number; // absolute position of the center of the column along the main axis
    name: string; // ordinal label
    padding: number;
    width: number; // width of the column
    x: number; // starting position of the column (along the main axis)
    xyData: ISemioticOrXyData<DataPoint>[];
    y: number;
    [key: string]: any;
  }

  export interface ISemioticOrSummaryPiece {
    isSummaryData: boolean;
    key: string; // data group (i.e. baseline or canary)
    label: string;
    summaryPieceName: string;
    type: string; // type of hover event (e.g. frame-hover)
    value: number;
    x: number;
    y: number;
  }

  export interface ISemioticOrFrameHoverArgs<DataPoint> {
    column?: ISemioticOrGroup<DataPoint>; //used
    summary?: ISemioticOrPiece<DataPoint>[]; //used
    type?: string; // type of hover event (e.g. frame-hover)
    points: undefined | ISemioticOrSummaryPiece[]; //used
    voronoiX?: number;
    voronoiY?: number;
    [key: string]: any;
  }

  export interface ISemioticOrFrameState {
    pieceDataXY: ISemioticOrSummaryPiece[];
  }

  export interface ISemioticAnnotationArgs<AnnotationData, CategoryData> {
    d: AnnotationData; // user-defined custom annotation data
    i: number; // index
    categories: {
      [label: string]: CategoryData;
    };
    orFrameState?: ISemioticOrFrameState;
    [key: string]: any;
  }

  export interface ICustomAnnotationProps {
    noteData: {
      x: number;
      y: number;
      dx?: number;
      dy?: number;
      nx?: number;
      ny?: number;
      note: {
        label: string;
        wrap?: number;
        align?: string;
        orientation?: string;
        padding?: number;
        color?: string;
        lineType?: string;
      };
      className?: string;
    };
  }

  export interface IAxisProps {
    className?: string;
    size: number[];
    scale: ScaleTime;
    orient?: string;
    label?: string | object;
    tickValues?: number[] | Date[];
    tickFormat?: (d: number) => JSX.Element | string;
    ticks?: number;
  }
}
