import { format } from 'd3-format';
import { quantile } from 'd3-array';
import { ISummaryStatistics } from './semiotic.service';

export const formatMetricValue = (value: number) => {
  if (Math.abs(value) > Math.pow(10, 24)) {
    return format('-.3~e')(value);
  } else return format('-.3~s')(value);
  // return format('-.3~e')(value)
  // return Math.abs(value) < 1 ? format('-.4~f')(value) : format('-,.2~s')(value);
};

export const calculateSummaryStatistics = (values: number[]): ISummaryStatistics => {
  const output = {
    min: {
      value: quantile(values, 0.0),
      label: 'Minimum',
    },
    q1area: {
      value: quantile(values, 0.25),
      label: '25th %-ile',
    },
    median: {
      value: quantile(values, 0.5),
      label: 'Median',
    },
    q3area: {
      value: quantile(values, 0.75),
      label: '75th %-ile',
    },
    max: {
      value: quantile(values, 1.0),
      label: 'Maximum',
    },
  };
  return output;
};
