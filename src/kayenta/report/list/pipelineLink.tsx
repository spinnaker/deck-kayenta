import * as React from 'react';
import { UISref } from '@uirouter/react';

interface IParentPipelineLinkProps {
  parentPipelineExecutionId: string;
  application: string;
}

export const PipelineLink = ({ parentPipelineExecutionId, application }: IParentPipelineLinkProps) => {
  return (
    <UISref
      to="home.applications.application.pipelines.executionDetails.execution"
      params={{
        application,
        executionId: parentPipelineExecutionId,
      }}
    >
      <a>Pipeline</a>
    </UISref>
  );
};
