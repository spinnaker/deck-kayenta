import { format } from 'd3-format';

export const formatMetricValue = (value: number) => {
  if (Math.abs(value) > Math.pow(10, 24)) {
    return format('-.3~e')(value);
  } else return format('-.3~s')(value);
  // return format('-.3~e')(value)
  // return Math.abs(value) < 1 ? format('-.4~f')(value) : format('-,.2~s')(value);
};
