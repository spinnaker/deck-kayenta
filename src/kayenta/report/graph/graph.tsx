import * as React from 'react';
import { connect } from 'react-redux';

import { GraphType, metricSetPairGraphService } from './metricSetPairGraph.service';
import { ICanaryState } from 'kayenta/reducers';

// TODO: externalize this as app state.
const graphType = GraphType.AmplitudeVsTime;

const MetricSetPairGraph = () => {

};

const mapStateToProps  = (state: ICanaryState) => (

);

export default connect()();
