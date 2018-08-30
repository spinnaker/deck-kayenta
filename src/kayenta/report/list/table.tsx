import * as React from 'react';
import { connect } from 'react-redux';
import * as moment from 'moment';

import { ITableColumn, Table } from 'kayenta/layout/table';
import { ICanaryState } from 'kayenta/reducers';
import { ICanaryExecutionStatusResult, CANARY_EXECUTION_NO_PIPELINE_STATUS } from 'kayenta/domain';
import FormattedDate from 'kayenta/layout/formattedDate';
import CenteredDetail from 'kayenta/layout/centeredDetail';
import Score from '../detail/score';
import ReportLink from './reportLink';
import ConfigLink from './configLink';
import { PipelineLink } from './pipelineLink';

import './executionList.less';

const columns: ITableColumn<ICanaryExecutionStatusResult>[] = [
  {
    label: 'Score / Report',
    getContent: execution => (
      <>
        <ReportLink
          configName={execution.config ? execution.config.name : execution.result.config.name}
          executionId={execution.pipelineId}
          application={execution.application}
        >
          <Score
            score={execution.result.judgeResult.score}
            showClassification={false}
            inverse={true}
          />{'  '}
          <FormattedDate dateIso={execution.startTimeIso} />
        </ReportLink>{'  '}
        {
          execution.startTimeIso &&
          <span className="color-text-caption body-small" style={{ marginLeft: '10px' }}>
            {moment(execution.startTimeIso).fromNow()}
          </span>
        }
      </>
    ),
    width: 2,
  },
  {
    label: 'Location',
    getContent: ({canaryExecutionRequest: { scopes }}) => {
      const locations = Array.from(
        Object.keys(scopes).reduce<Set<string>>((acc, scope) => 
          acc.add(scopes[scope].controlScope.location) && acc.add(scopes[scope].controlScope.location)
        , new Set())
      );

      return (
        <div className="vertical">
          {locations.map((location) => <span key={location}>{location}</span>)}
        </div>
      );
    },
    width: 1,
  },
  {
    label: 'Config',
    getContent: execution => (
      <ConfigLink
        configName={execution.config ? execution.config.name : execution.result.config.name}
        executionId={execution.pipelineId}
        application={execution.application}
      />
    ),
    width: 1,
  },
  {
    label: 'Scope',
    getContent: ({ canaryExecutionRequest: { scopes } }) => {
      const scopeNames = Array.from(
        Object.keys(scopes).reduce<Set<string>>((acc, scope) =>
          acc.add(scopes[scope].controlScope.scope) && acc.add(scopes[scope].controlScope.scope)
          , new Set())
      );

      return (
        <div className="vertical">
          {scopeNames.map((scope) => <span key={scope}>{scope}</span>)}
        </div>
      );
    },
    width: 1,
  },
  {
    getContent: ({ parentPipelineExecutionId, application }) => (
      parentPipelineExecutionId && parentPipelineExecutionId !== CANARY_EXECUTION_NO_PIPELINE_STATUS &&
        <PipelineLink
          parentPipelineExecutionId={parentPipelineExecutionId}
          application={application}
        />
    ),
    width: 1,
  },
];

interface IExecutionListTableStateProps {
  executions: ICanaryExecutionStatusResult[];
}

const ExecutionListTable = ({ executions }: IExecutionListTableStateProps) => {
  if (!executions || !executions.length) {
    return (
      <CenteredDetail>
        <h3 className="heading-3">No canary execution history for this application.</h3>
      </CenteredDetail>
    );
  }

  return (
    <Table
      rows={executions}
      className="vertical flex-1 execution-list-table"
      columns={columns}
      rowKey={execution => execution.pipelineId}
      tableBodyClassName="flex-1"
    />
  );
};

const mapStateToProps = (state: ICanaryState) => ({
  executions: Object.values(state.data.executions.data).filter(e => e.result),
});

export default connect(mapStateToProps)(ExecutionListTable);
