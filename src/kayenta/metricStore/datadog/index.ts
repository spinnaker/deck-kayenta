import { get } from 'lodash';
import metricStoreConfigStore from '../metricStoreConfig.service';
import DatadogMetricConfigurer from './metricConfigurer';
import { ICanaryMetricConfig } from 'kayenta/domain/ICanaryConfig';

metricStoreConfigStore.register({
  name: 'datadog',
  metricConfigurer: DatadogMetricConfigurer,
  queryFinder: (metric: ICanaryMetricConfig) => get(metric, 'query.metricType', ''),
  useTemplates: true,
});
