import { format } from 'd3-format';

export const formatMetricValue = (value: number) => {
  return Math.abs(value) < 1 ? format('-.4~f')(value) : format('-,.2~s')(value);
};
