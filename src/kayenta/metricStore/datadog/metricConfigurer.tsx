import * as React from 'react';
import * as Select from 'react-select';
import { Action } from 'redux';
import { connect } from 'react-redux';
import { get } from 'lodash';
import FormRow from 'kayenta/layout/formRow';
import { ICanaryState } from 'kayenta/reducers';
import { ICanaryMetricConfig } from 'kayenta/domain/ICanaryConfig';
import { IUpdateListPayload, List } from 'kayenta/layout/list';
import * as Creators from 'kayenta/actions/creators';
import DatadogMetricTypeSelector from './metricTypeSelector';

interface IDatadogMetricConfigurerStateProps {
  editingMetric: ICanaryMetricConfig;
}

interface IDatadogMetricConfigurerDispatchProps {
  updateMetricType: (option: Select.Option) => void;
  updateGroupBy: (payload: IUpdateListPayload) => void;
}

/*
* Component for configuring a Datadog metric.
* */
function DatadogMetricConfigurer({ editingMetric, updateMetricType, updateGroupBy }: IDatadogMetricConfigurerStateProps & IDatadogMetricConfigurerDispatchProps) {
  return (
    <section>
      <FormRow label="Metric Type">
        <DatadogMetricTypeSelector
          value={get(editingMetric, 'query.metricType', '')}
          onChange={updateMetricType}
        />
      </FormRow>
      <FormRow label="Group By">
        <List
          list={editingMetric.query.groupByFields || []}
          actionCreator={updateGroupBy}
        />
      </FormRow>
    </section>
  );
}

function mapStateToProps(state: ICanaryState): IDatadogMetricConfigurerStateProps {
  return {
    editingMetric: state.selectedConfig.editingMetric,
  };
}

function mapDispatchToProps(dispatch: (action: Action & any) => void): IDatadogMetricConfigurerDispatchProps {
  return {
    updateMetricType: (option: Select.Option): void => {
      dispatch(Creators.updateDatadogMetricType({
        metricType: (option ? option.value : null) as string,
      }));
    },
    updateGroupBy: payload => dispatch(Creators.updateDatadogGroupBy(payload)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DatadogMetricConfigurer);
