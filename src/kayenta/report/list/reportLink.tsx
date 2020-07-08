import * as React from 'react';
import { connect } from 'react-redux';
import { ICanaryState } from 'kayenta/reducers';
import { resolveConfigIdFromExecutionId } from 'kayenta/selectors';
import { UISref } from '@uirouter/react';

interface IReportLinkOwnProps {
  configName: string;
  executionId: string;
  application: string;
  children?: React.ReactNode;
}

interface IReportLinkStateProps {
  configId: string;
}

export const ReportLink = ({ configId, executionId, children }: IReportLinkOwnProps & IReportLinkStateProps) => {
  return (
    <UISref
      to="^.reportDetail"
      params={{
        configId,
        runId: executionId,
      }}
    >
      <a>{children}</a>
    </UISref>
  );
};

const mapStateToProps = (
  state: ICanaryState,
  ownProps: IReportLinkOwnProps,
): IReportLinkStateProps & IReportLinkOwnProps => {
  return {
    configId: resolveConfigIdFromExecutionId(state, ownProps.executionId),
    ...ownProps,
  };
};

export default connect(mapStateToProps)(ReportLink);
