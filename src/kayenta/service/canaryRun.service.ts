import { REST, ReactInjector } from '@spinnaker/core';

import { CanarySettings } from 'kayenta/canary.settings';
import {
  IMetricSetPair,
  ICanaryExecutionStatusResult,
  ICanaryExecutionRequest,
  ICanaryExecutionRequestParams,
  ICanaryExecutionResponse,
} from 'kayenta/domain';

export const getCanaryRun = (configId: string, canaryExecutionId: string): PromiseLike<ICanaryExecutionStatusResult> =>
  REST()
    .path('v2', 'canaries', 'canary', configId, canaryExecutionId)
    .query({ storageAccountName: CanarySettings.storageAccountName })
    .useCache()
    .get()
    .then((run: ICanaryExecutionStatusResult) => {
      const { config } = run;
      config.id = configId;
      run.id = canaryExecutionId;
      run.result?.judgeResult.results.sort((a, b) => a.name.localeCompare(b.name));
      return run;
    });

export const startCanaryRun = (
  configId: string,
  executionRequest: ICanaryExecutionRequest,
  params: ICanaryExecutionRequestParams = {},
): PromiseLike<ICanaryExecutionResponse> => {
  return REST()
    .path('v2', 'canaries', 'canary', configId)
    .query(params as any)
    .post(executionRequest);
};

export const getMetricSetPair = (metricSetPairListId: string, metricSetPairId: string): PromiseLike<IMetricSetPair> =>
  REST()
    .path('v2', 'canaries', 'metricSetPairList', metricSetPairListId)
    .query({ storageAccountName: CanarySettings.storageAccountName })
    .useCache()
    .get()
    .then((list: IMetricSetPair[]) => list.find((pair) => pair.id === metricSetPairId));

export const listCanaryExecutions = (application: string): PromiseLike<ICanaryExecutionStatusResult[]> => {
  const limit = ReactInjector.$stateParams.count || 20;
  return REST().path('v2', 'canaries', application, 'executions').query({ limit }).get();
};

export const getHealthLabel = (health: string, result: string): string => {
  const healthLC = (health || '').toLowerCase();
  const resultLC = (result || '').toLowerCase();
  return healthLC === 'unhealthy'
    ? 'unhealthy'
    : resultLC === 'success'
    ? 'healthy'
    : resultLC === 'failure'
    ? 'failing'
    : 'unknown';
};
