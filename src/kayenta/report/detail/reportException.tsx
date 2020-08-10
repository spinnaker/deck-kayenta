import * as React from 'react';
import { connect } from 'react-redux';

import { ICanaryState } from 'kayenta/reducers';
import { ICanaryExecutionException } from 'kayenta/domain';
import SourceLinks from './sourceLinks';

import './reportExplanation.less';

interface IReportExceptionProps {
  exception: ICanaryExecutionException;
}

const ReportException = ({ exception }: IReportExceptionProps) => {
  const message =
    exception.details?.error ??
    exception.details.errors?.join('\n') ??
    'No error message provided. Click the "Report" link to see more details.';
  return (
    <>
      <h3 className="text-center">Canary report failed</h3>
      <dl>
        <dt>Details</dt>
        <dd>
          <code>{message}</code>
        </dd>
        <dt>Source</dt>
        <dd>
          <SourceLinks />
        </dd>
      </dl>
    </>
  );
};

const mapStateToProps = (state: ICanaryState) => ({
  exception: state.selectedRun.run.exception,
});

export default connect(mapStateToProps)(ReportException);
