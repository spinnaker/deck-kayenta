import * as React from 'react';
import * as classNames from 'classnames';
import { connect, Dispatch } from 'react-redux';

import { ICanaryJudgeGroupScore } from '../domain/ICanaryJudgeResult';
import ClickableHeader from './clickableHeader';
import * as Creators from 'kayenta/actions/creators';
import { ICanaryState } from '../reducers/index';
import { IGroupWeights } from '../domain/ICanaryConfig';
import { serializedGroupWeightsSelector, serializedCanaryConfigSelector } from '../selectors/index';
import { mapGroupToColor } from './colors';

export interface IGroupScoresOwnProps {
  groups: ICanaryJudgeGroupScore[];
  className?: string;
}

interface IGroupScoresStateProps {
  groupWeights: IGroupWeights;
  scoreThresholds: { pass: number, marginal: number };
  selectedGroup: string;
}

interface IGroupScoresDispatchProps {
  select: (event: any) => void;
}

/*
* Renders list of group scores.
* */
const GroupScores = ({ groups, groupWeights, scoreThresholds, className, select, selectedGroup }: IGroupScoresOwnProps & IGroupScoresDispatchProps & IGroupScoresStateProps) => (
  <section className={classNames('horizontal', className)}>
    {groups.map(g => (
      <ClickableHeader
        key={g.name}
        style={{
          width: `${groupWeights[g.name]}%`, // TODO: at some point (around 4%), the group name doesn't fit.
          backgroundColor: mapGroupToColor(g, scoreThresholds),
        }}
        onClick={() => select(g.name)}
        label={g.name}
        className={classNames(g.name === selectedGroup ? 'active' : '', 'report-score')}
      />
    ))}
  </section>
);

const mapStateToProps = (state: ICanaryState): IGroupScoresStateProps => ({
  selectedGroup: state.selectedRun.selectedGroup,
  groupWeights: serializedGroupWeightsSelector(state),
  scoreThresholds: serializedCanaryConfigSelector(state).classifier.scoreThresholds,
});

const mapDispatchToProps = (
  dispatch: Dispatch<ICanaryState>,
  ownProps: IGroupScoresOwnProps,
): IGroupScoresOwnProps & IGroupScoresDispatchProps => ({
  select: (group: string) =>
    dispatch(Creators.selectReportMetricGroup({ group })),
  ...ownProps,
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupScores);
