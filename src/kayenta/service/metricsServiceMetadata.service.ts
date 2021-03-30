import { API } from '@spinnaker/core';

import { IMetricsServiceMetadata } from 'kayenta/domain/IMetricsServiceMetadata';

export const listMetricsServiceMetadata = (
  filter?: string,
  metricsAccountName?: string,
): PromiseLike<IMetricsServiceMetadata[]> =>
  API.one('v2', 'canaries', 'metadata', 'metricsService').withParams({ filter, metricsAccountName }).get();
