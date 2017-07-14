import { get } from 'lodash';

import { combineReducers, Action } from 'redux';
import { ICanaryConfig, ICanaryMetricConfig } from '../domain/ICanaryConfig';
import { ICanaryConfigSummary } from '../domain/ICanaryConfigSummary';
import { ConfigDetailLoadState } from '../edit/configDetailLoader';
import {
  ADD_METRIC, SELECT_CONFIG, UPDATE_CONFIG_SUMMARIES,
  CONFIG_LOAD_ERROR, DISMISS_SAVE_CONFIG_ERROR, INITIALIZE, LOAD_CONFIG,
  RENAME_METRIC, SAVE_CONFIG_ERROR, SAVE_CONFIG_SAVING, SAVE_CONFIG_SAVED,
} from '../actions/index';
import { SaveConfigState } from '../edit/save';

export interface ICanaryState {
  configSummaries: ICanaryConfigSummary[];
  selectedConfig: ICanaryConfig;
  configLoadState: ConfigDetailLoadState;
  metricList: ICanaryMetricConfig[];
  saveConfigState: SaveConfigState;
  saveConfigErrorMessage: string;
}

function configSummaries(state: ICanaryConfigSummary[] = [], action: Action & any): ICanaryConfigSummary[] {
  switch (action.type) {
    case INITIALIZE:
      return action.state.configSummaries;

    case UPDATE_CONFIG_SUMMARIES:
      return action.configSummaries;

    default:
      return state;
  }
}

function selectedConfig(state: ICanaryConfig = null, action: Action & any): ICanaryConfig {
  switch (action.type) {
    case INITIALIZE:
      return action.state.selectedConfig;

    case SELECT_CONFIG:
      return action.config;

    default:
      return state;
  }
}

function configLoadState(state: ConfigDetailLoadState = ConfigDetailLoadState.Loaded, action: Action & any): ConfigDetailLoadState {
  switch (action.type) {
    case LOAD_CONFIG:
      return ConfigDetailLoadState.Loading;

    case CONFIG_LOAD_ERROR:
      return ConfigDetailLoadState.Error;

    case SELECT_CONFIG:
      return ConfigDetailLoadState.Loaded;

    default:
      return state;
  }
}

function reduceMetric(metric: ICanaryMetricConfig, id: string, action: Action & any): ICanaryMetricConfig {
  if (id === action.id) {
    switch (action.type) {

      case RENAME_METRIC:
        return Object.assign({}, metric, { name: action.name });

      default:
        return metric;

    }
  } else {
    return metric;
  }
}

function metricList(state: ICanaryMetricConfig[] = [], action: Action & any): ICanaryMetricConfig[] {
  switch (action.type) {
    case INITIALIZE:
      return action.state.metricList;

    case SELECT_CONFIG:
      return action.config.metrics;

    case ADD_METRIC:
      return state.concat([action.metric]);

    case RENAME_METRIC:
      return state.map((metric, index) => reduceMetric(metric, String(index), action));

    default:
      return state;
  }
}

function saveConfigState(state: SaveConfigState = SaveConfigState.Saved, action: Action & any): SaveConfigState {
  switch (action.type) {
    case SAVE_CONFIG_SAVING:
      return SaveConfigState.Saving;

    case SAVE_CONFIG_SAVED:
      return SaveConfigState.Saved;

    case SAVE_CONFIG_ERROR:
      return SaveConfigState.Error;

    case DISMISS_SAVE_CONFIG_ERROR:
      return SaveConfigState.Saved;

    default:
      return state;
  }
}

function saveConfigErrorMessage(state: string = null, action: Action & any): string {
  switch (action.type) {
    case SAVE_CONFIG_SAVING:
      return null;

    case SAVE_CONFIG_ERROR:
      return get(action, 'error.data.message', null);

    case DISMISS_SAVE_CONFIG_ERROR:
      return null;

    default:
      return state;
  }
}

export const rootReducer = combineReducers<ICanaryState>({
  configSummaries,
  selectedConfig,
  configLoadState,
  metricList,
  saveConfigState,
  saveConfigErrorMessage
});
