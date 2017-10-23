import { MetricClassificationLabel } from 'kayenta/domain/MetricClassificationLabel';
import { ScoreClassificationLabel } from '../domain/ScoreClassificationLabel';

const GREEN = 'var(--color-success)';
const RED = 'var(--color-danger)';
const GREY = 'var(--color-alto)';
const YELLOW = 'var(--color-warning)';

const mapMetricClassificationToColor = (classification: MetricClassificationLabel): string => {
  return {
    [MetricClassificationLabel.High]: RED,
    [MetricClassificationLabel.Low]: RED,
    [MetricClassificationLabel.Error]: YELLOW,
    [MetricClassificationLabel.Nodata]: GREY,
    [MetricClassificationLabel.Pass]: GREEN,
  }[classification];
};

const mapScoreClassificationToColor = (classification: ScoreClassificationLabel): string => {
  return {
    [ScoreClassificationLabel.Fail]: RED,
    [ScoreClassificationLabel.Error]: YELLOW,
    [ScoreClassificationLabel.Marginal]: GREY,
    [ScoreClassificationLabel.Nodata]: GREY,
    [ScoreClassificationLabel.Pass]: GREEN,
  }[classification];
};
