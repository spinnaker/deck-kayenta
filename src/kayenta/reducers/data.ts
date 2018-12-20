import { Action, combineReducers, Reducer } from 'redux';
import { handleActions } from 'redux-actions';
import { without } from 'lodash';

import { Application } from '@spinnaker/core';

import * as Actions from '../actions';
import {
  ICanaryConfigSummary,
  IJudge,
  ICanaryConfig,
  ICanaryExecutionStatusResult,
  IMetricsServiceMetadata,
  IKayentaAccount,
} from 'kayenta/domain';
import { AsyncRequestState } from './asyncRequest';

interface IMetricsServiceMetadataState {
  load: AsyncRequestState;
  data: IMetricsServiceMetadata[];
}

interface IExecutionsState {
  load: AsyncRequestState;
  data: ICanaryExecutionStatusResult[];
}

interface IKayentaAccountsState {
  load: AsyncRequestState;
  data: IKayentaAccount[];
}

export interface IDataState {
  application: Application;
  configSummaries: ICanaryConfigSummary[];
  configs: ICanaryConfig[];
  judges: IJudge[];
  metricsServiceMetadata: IMetricsServiceMetadataState;
  executions: IExecutionsState;
  kayentaAccounts: IKayentaAccountsState;
}

export const application = handleActions(
  {
    [Actions.INITIALIZE]: (_state: Application, action: Action & any) => action.state.data.application,
  },
  null,
);

export const configSummaries = handleActions(
  {
    [Actions.INITIALIZE]: (_state: ICanaryConfigSummary, action: Action & any) => action.state.data.configSummaries,
    [Actions.UPDATE_CONFIG_SUMMARIES]: (_state: ICanaryConfigSummary, action: Action & any) =>
      action.payload.configSummaries,
  },
  [],
);

const configs = handleActions(
  {
    [Actions.LOAD_CONFIG_SUCCESS]: (state: ICanaryConfig[], action: Action & any): ICanaryConfig[] => {
      if (state.some(config => config.id === action.payload.config.id)) {
        return without(state, state.find(config => config.id === action.payload.config.id)).concat([
          action.payload.config,
        ]);
      } else {
        return state.concat([action.payload.config]);
      }
    },
  },
  [],
);

const judges = handleActions(
  {
    [Actions.INITIALIZE]: (_state: IJudge[], action: Action & any): IJudge[] => action.state.data.judges,
    [Actions.UPDATE_JUDGES]: (_state: IJudge[], action: Action & any): IJudge[] => action.payload.judges,
  },
  null,
);

const executions = combineReducers<IExecutionsState>({
  data: handleActions(
    {
      [Actions.LOAD_EXECUTIONS_SUCCESS]: (_state: ICanaryExecutionStatusResult[], action: Action & any) =>
        action.payload.executions,
    },
    [],
  ),
  load: handleActions(
    {
      [Actions.LOAD_EXECUTIONS_REQUEST]: () => AsyncRequestState.Requesting,
      [Actions.LOAD_EXECUTIONS_SUCCESS]: () => AsyncRequestState.Fulfilled,
      [Actions.LOAD_EXECUTIONS_FAILURE]: () => AsyncRequestState.Failed,
    },
    AsyncRequestState.Requesting,
  ),
});

const metricsServiceMetadata = combineReducers<IMetricsServiceMetadataState>({
  load: handleActions(
    {
      [Actions.LOAD_METRICS_SERVICE_METADATA_REQUEST]: () => AsyncRequestState.Requesting,
      [Actions.LOAD_METRICS_SERVICE_METADATA_SUCCESS]: () => AsyncRequestState.Fulfilled,
      [Actions.LOAD_METRICS_SERVICE_METADATA_FAILURE]: () => AsyncRequestState.Failed,
    },
    AsyncRequestState.Fulfilled,
  ),
  data: handleActions(
    {
      [Actions.LOAD_METRICS_SERVICE_METADATA_SUCCESS]: (_state: IMetricsServiceMetadata[], action: Action & any) =>
        action.payload.data,
      [Actions.UPDATE_PROMETHEUS_METRIC_TYPE]: (state: IMetricsServiceMetadata, action: Action & any) => {
        // When the user clears the Prometheus metric type dropdown,
        // clear the backing set of metric descriptors, since they
        // no longer apply to the filter.
        return action.payload.metricName ? state : [];
      },
      [Actions.UPDATE_STACKDRIVER_METRIC_TYPE]: (state: IMetricsServiceMetadata, action: Action & any) => {
        // When the user clears the Stackdriver metric type dropdown,
        // clear the backing set of metric descriptors, since they
        // no longer apply to the filter.
        return action.payload.metricType ? state : [];
      },
      [Actions.UPDATE_DATADOG_METRIC_TYPE]: (state: IMetricsServiceMetadata, action: Action & any) => {
        // When the user clears the Datadog metric type dropdown,
        // clear the backing set of metric descriptors, since they
        // no longer apply to the filter.
        return action.payload.metricType ? state : [];
      },
      [Actions.UPDATE_GRAPHITE_METRIC_NAME]: (state: IMetricsServiceMetadata, action: Action & any) => {
        return action.payload.metricName ? state : [];
      },
      [Actions.EDIT_METRIC_BEGIN]: () => [],
    },
    [],
  ),
});

const kayentaAccounts = combineReducers<IKayentaAccountsState>({
  load: handleActions<AsyncRequestState>(
    {
      [Actions.LOAD_KAYENTA_ACCOUNTS_REQUEST]: () => AsyncRequestState.Requesting,
      [Actions.LOAD_KAYENTA_ACCOUNTS_SUCCESS]: () => AsyncRequestState.Fulfilled,
      [Actions.LOAD_KAYENTA_ACCOUNTS_FAILURE]: () => AsyncRequestState.Failed,
    },
    AsyncRequestState.Requesting,
  ),
  data: handleActions<IKayentaAccount[]>(
    {
      [Actions.LOAD_KAYENTA_ACCOUNTS_SUCCESS]: (_state, action: Action & any) => action.payload.accounts,
    },
    [],
  ),
});

export const data: Reducer<IDataState> = combineReducers<IDataState>({
  application,
  configSummaries,
  judges,
  configs,
  executions,
  metricsServiceMetadata,
  kayentaAccounts,
});
