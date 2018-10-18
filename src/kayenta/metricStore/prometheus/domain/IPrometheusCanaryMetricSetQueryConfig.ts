import { ICanaryMetricSetQueryConfig } from 'kayenta/domain';

export interface IPrometheusCanaryMetricSetQueryConfig extends ICanaryMetricSetQueryConfig {
  resourceType: string;
  metricName: string;
  labelBindings: string[];
  groupByFields: string[];
}
