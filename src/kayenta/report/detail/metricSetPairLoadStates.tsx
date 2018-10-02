import * as React from 'react';
import { connect } from 'react-redux';

import LoadStatesBuilder from 'kayenta/components/loadStates';
import { ICanaryState } from 'kayenta/reducers/index';
import { AsyncRequestState } from 'kayenta/reducers/asyncRequest';
import MetricResultDetailLayout from './metricResultDetailLayout';

const MetricSetPairLoadStates = ({ state }: { state: AsyncRequestState }) => {
  const LoadStates = new LoadStatesBuilder()
    .onFulfilled(<MetricResultDetailLayout />)
    .onFailed(<h3 className="heading-3 text-center">Could not load metrics.</h3>)
    .build();

  return <LoadStates state={state} />;
};

const mapStateToProps = (state: ICanaryState) => ({
  state: state.selectedRun.metricSetPair.load,
});

export default connect(mapStateToProps)(MetricSetPairLoadStates);
