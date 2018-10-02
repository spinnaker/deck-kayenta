import * as React from 'react';
import { round } from 'lodash';
import { ScoreClassificationLabel } from 'kayenta/domain/ScoreClassificationLabel';
import { ICanaryJudgeScore } from 'kayenta/domain/ICanaryJudgeResult';
import { CanaryScore } from 'kayenta/components/canaryScore';

export interface ICanaryJudgeScoreProps {
  score: ICanaryJudgeScore;
  showClassification?: boolean;
  inverse?: boolean;
}

export default ({ score, showClassification, inverse }: ICanaryJudgeScoreProps) => (
  <CanaryScore
    className="score-report"
    score={round(score.score, 2)}
    result={mapKayentaToACA(score).result}
    health={mapKayentaToACA(score).health}
    classification={showClassification ? score.classification : null}
    inverse={inverse}
  />
);

// TODO(dpeach): don't use ACA statuses in the CanaryScore component.
const mapKayentaToACA = (score: ICanaryJudgeScore): { health: string; result: string } => {
  if (score.classification === ScoreClassificationLabel.Pass) {
    return { health: null, result: 'success' };
  } else if (score.classification === ScoreClassificationLabel.Fail) {
    return { health: 'unhealthy', result: null };
  } else {
    return { health: null, result: null };
  }
};
