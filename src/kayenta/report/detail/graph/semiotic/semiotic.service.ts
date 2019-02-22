import { IMetricSetPairGraphProps } from '../metricSetPairGraph.service';

export interface ISemioticChartProps extends IMetricSetPairGraphProps {
  config: any;
  parentWidth: number;
}

export interface IMargin {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}
