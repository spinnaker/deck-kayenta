import { IMetricsServiceMetadata } from 'kayenta/domain/IMetricsServiceMetadata';

export interface IDatadogMetricDescriptor extends IMetricsServiceMetadata {
  metricKind: string;
  labels: IDatadogMetricDescriptorLabels[];
  name: string;
  displayName: string;
  type: string;
  description: string;
  unit: string;
  valueType: string;
}

export interface IDatadogMetricDescriptorLabels {
  description: string;
  key: string;
}
