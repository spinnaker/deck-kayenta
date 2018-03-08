import { ICanaryMetricSetQueryConfig } from 'kayenta/domain';

export interface IDatadogCanaryMetricSetQueryConfig extends ICanaryMetricSetQueryConfig {
  metricType: string;
  groupByFields: string[];
}
