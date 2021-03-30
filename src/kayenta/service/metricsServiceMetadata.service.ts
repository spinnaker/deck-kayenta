import { REST } from '@spinnaker/core';

import { IMetricsServiceMetadata } from 'kayenta/domain/IMetricsServiceMetadata';

export const listMetricsServiceMetadata = (
  filter?: string,
  metricsAccountName?: string,
): PromiseLike<IMetricsServiceMetadata[]> =>
  REST('/v2/canaries/metadata/metricsService').query({ filter, metricsAccountName }).get();
