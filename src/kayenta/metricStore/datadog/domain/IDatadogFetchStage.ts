import { IExecutionStage } from '@spinnaker/core';

export const DATADOG_FETCH_STAGE = 'datadogFetch';

export interface IDatadogFetchStage extends IExecutionStage {
  context: {
    metricsAccountName: string;
    storageAccountName: string;
    configurationAccountName: string;
    datadogCanaryScope: {
      scope: string;
      start: number;
      end: number;
      step: number;
      intervalStartTimeIso: string;
      intervalEndTimeIso: string
    };
    canaryConfigId: string;
    metricSetListIds: string[];
  };
}
