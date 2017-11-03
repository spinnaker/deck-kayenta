import { ICanaryState } from './index';

export interface IConfigValidationState {
  isConfigNameUnique: boolean;
  isConfigNameValid: boolean;
  isGroupWeightsValid: boolean;
}

const isConfigNameUnique = (state: ICanaryState): ICanaryState => {
  if (!state.selectedConfig.config) {
    return state;
  }

  const selectedConfig = state.selectedConfig.config;
  const configSummaries = state.data.configSummaries;
  const isUnique = configSummaries.every(s =>
    selectedConfig.name !== s.name || selectedConfig.id === s.id
  );
  return {
    ...state,
    configValidation: {
      ...state.configValidation,
      isConfigNameUnique: isUnique,
    },
  };
};

// See https://github.com/Netflix-Skunkworks/kayenta/blob/master/kayenta-web/src/main/java/com/netflix/kayenta/controllers/CanaryConfigController.java
const pattern = /^[a-zA-Z0-9\_\-]*$/;

const isConfigNameValid = (state: ICanaryState): ICanaryState => {
  if (!state.selectedConfig.config) {
    return state;
  }

  const isValid = pattern.test(state.selectedConfig.config.name);

  return {
    ...state,
    configValidation: {
      ...state.configValidation,
      isConfigNameValid: isValid,
    },
  };
};

const isGroupWeightsValid = (state: ICanaryState): ICanaryState => {
  if (!state.selectedConfig.config) {
    return state;
  }

  const groupWeightsSum =
    Object.values(state.selectedConfig.group.groupWeights)
      .reduce((sum, weight) => sum + weight, 0);

  return {
    ...state,
    configValidation: {
      ...state.configValidation,
      isGroupWeightsValid: groupWeightsSum === 100,
    },
  };
};


export const validatorsReducer = (state: ICanaryState): ICanaryState =>
  [
    isConfigNameUnique,
    isConfigNameValid,
    isGroupWeightsValid,
  ].reduce((s, reducer) => reducer(s), state);
