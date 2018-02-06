import * as React from 'react';
import { connect } from 'react-redux';
import { ICanaryState } from 'kayenta/reducers';
import { resolveConfigIdFromNameAndApplication } from 'kayenta/selectors';
import { Link } from './link';

interface IReportLinkOwnProps {
  configName: string;
  executionId: string;
  application: string;
}

interface IReportLinkStateProps {
  configId: string;
}

export const ReportLink = ({ configId, executionId }: IReportLinkOwnProps & IReportLinkStateProps) => {
  return (
    <Link
      targetState="^.reportDetail"
      stateParams={{
        configId,
        runId: executionId,
      }}
      linkText="Report"
    />
  );
};

const mapStateToProps = (state: ICanaryState, ownProps: IReportLinkOwnProps): IReportLinkStateProps & IReportLinkOwnProps => {
  return {
    configId: resolveConfigIdFromNameAndApplication(state, ownProps.configName, ownProps.application),
    ...ownProps,
  };
};

export default connect(mapStateToProps)(ReportLink);
