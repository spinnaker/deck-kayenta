import * as React from 'react';
import { connect } from 'react-redux';
import { ICanaryMetricConfig } from 'kayenta/domain/ICanaryConfig';
import metricStoreConfigService from 'kayenta/metricStore/metricStoreConfig.service';
import { ICanaryState } from 'kayenta/reducers';

interface IMetricConfigurerDelegatorStateProps {
  editingMetric: ICanaryMetricConfig;
}

/*
* Should find and render the appropriate metric configurer for a given metric store.
* */
function MetricConfigurerDelegator({ editingMetric }: IMetricConfigurerDelegatorStateProps) {
  const config = metricStoreConfigService.getDelegate(editingMetric.query.type);
  if (config && config.metricConfigurer) {
    const MetricConfigurer = config.metricConfigurer;
    return <MetricConfigurer />;
  } else {
    return <p>Metric configuration has not been implemented for {editingMetric.query.type}.</p>;
  }
}

function mapStateToProps(state: ICanaryState): IMetricConfigurerDelegatorStateProps {
  return {
    editingMetric: state.selectedConfig.editingMetric,
  };
}

export default connect(mapStateToProps)(MetricConfigurerDelegator);
