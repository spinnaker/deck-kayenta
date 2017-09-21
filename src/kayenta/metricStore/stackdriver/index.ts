import { metricStoreConfigService } from '../metricStoreConfig.service';
import StackdriverMetricConfigurer from './metricConfigurer';

metricStoreConfigService.register('stackdriver', {
  metricConfigurer: StackdriverMetricConfigurer,
});
