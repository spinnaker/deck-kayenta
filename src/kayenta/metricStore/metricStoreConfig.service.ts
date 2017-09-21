import * as React from 'react';
import { delegateComponentFactory, delegateServiceFactory } from 'kayenta/components/delegate';

export interface IMetricStoreConfig {
  metricConfigurer: React.ComponentClass;
}

export const metricStoreConfigService = delegateServiceFactory<IMetricStoreConfig>();
export const MetricStoreConfigDelegator = delegateComponentFactory(metricStoreConfigService);
