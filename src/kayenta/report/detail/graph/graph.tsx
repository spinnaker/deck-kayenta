import * as React from 'react';
import { connect } from 'react-redux';

import { GraphType, metricSetPairGraphService } from './metricSetPairGraph.service';
import { ICanaryState } from 'kayenta/reducers';
import { IMetricSetPair } from 'kayenta/domain/IMetricSetPair';
import { ICanaryAnalysisResult } from 'kayenta/domain/ICanaryJudgeResult';
import { metricResultsSelector } from 'kayenta/selectors';
import { CanarySettings } from 'kayenta/canary.settings';

interface IMetricSetPairGraphStateProps {
  pair: IMetricSetPair;
  result: ICanaryAnalysisResult;
  graphType: GraphType;
}

const MetricSetPairGraph = ({ pair, result, graphType }: IMetricSetPairGraphStateProps) => {
  const delegates = CanarySettings.graphImplementation
    .split(',')
    .map(name => metricSetPairGraphService.getDelegate(name))
    .filter(delegate => !!delegate);

  const delegate = delegates.find(candidate => candidate.handlesGraphType(graphType));
  if (!delegate) {
    return <h3 className="heading-3">Could not load graph.</h3>;
  }

  const Graph = delegate.getGraph();
  return <Graph metricSetPair={pair} result={result} type={graphType}/>
};

const mapStateToProps  = (state: ICanaryState): IMetricSetPairGraphStateProps => {
  const selectedMetric = state.selectedRun.selectedMetric;
  return {
    pair: state.selectedRun.metricSetPair.pair,
    result: metricResultsSelector(state).find(result => result.id === selectedMetric),
    graphType: GraphType.Histogram
  };
};

export default connect(mapStateToProps)(MetricSetPairGraph);
