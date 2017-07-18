import * as React from 'react';
import { Action } from 'redux';
import { connect } from 'react-redux';
import { ICanaryMetricConfig } from '../domain/ICanaryConfig';
import { ICanaryState } from '../reducers';
import MetricDetail from './metricDetail';
import OpenDeleteModalButton from './openDeleteModalButton';
import { ADD_METRIC, RENAME_METRIC } from '../actions/index';

interface IMetricListStateProps {
  selectedGroup: string,
  metrics: ICanaryMetricConfig[];
}

interface IMetricListDispatchProps {
  changeName: (event: any) => void;
  addMetric: (event: any) => void;
}

/*
 * Configures an entire list of metrics.
 */
function MetricList({ metrics, selectedGroup, changeName, addMetric }: IMetricListStateProps & IMetricListDispatchProps) {
  return (
    <section>
      <h2>Metrics</h2>
      {/*TODO: this button should not go here, but there is no good spot for it now.*/}
      <OpenDeleteModalButton/>
      <ul className="list-group">
        {metrics.map((metric, index) => (
          <li className="list-group-item" key={index}>
            <MetricDetail metric={metric} changeName={changeName}/>
          </li>
        ))}
      </ul>
      <button data-group={selectedGroup} onClick={addMetric}>Add Metric</button>
    </section>
  );
}

function mapStateToProps(state: ICanaryState): IMetricListStateProps {
  const { selectedGroup, metricList } = state;
  const filter = selectedGroup
    ? (metric: ICanaryMetricConfig) => metric.groups.includes(selectedGroup)
    : (metric: ICanaryMetricConfig) => metric.groups.length === 0;
  return {
    selectedGroup,
    metrics: metricList.filter(filter)
  };
}

function mapDispatchToProps(dispatch: (action: Action & any) => void): IMetricListDispatchProps {
  return {
    changeName: (event: any) => {
      dispatch({
        type: RENAME_METRIC,
        id: event.target.dataset.id,
        name: event.target.value
      });
    },

    addMetric: (event: any) => {
      const group = event.target.dataset.group;
      dispatch({
        type: ADD_METRIC,
        metric: {
          // TODO: need to block saving an invalid name
          // TODO: for Atlas metrics, attempt to gather name when query changes
          name: '',
          // TODO: we should have a default service setting somewhere
          serviceName: 'atlas',
          groups: group ? [group] : []
        }
      })
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MetricList);
