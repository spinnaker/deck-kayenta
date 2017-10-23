import * as React from 'react';

import { IMetricSetPair } from 'kayenta/domain/IMetricSetPair';
import { ICanaryAnalysisResult } from 'kayenta/domain/ICanaryJudgeResult';
import { buildDelegateService } from 'kayenta/service/delegateFactory';

export interface IMetricSetPairGraph {
  /*
  * Name of the graph implementation, referenced in settings.js.
  * */
  name: string;

  /*
  * Returns top-level graph component.
  * */
  getGraph(): React.Component;

  /*
  * Returns true if the graph implementation supports a given graph type.
  * */
  handlesGraphType(): boolean;

  /*
  * Handles a given graph type.
  * */
  handleGraphType(type: GraphType, metricSetPair: IMetricSetPair, result: ICanaryAnalysisResult): void;
}

// e.g., amplitude vs. time, histogram, etc.
export enum GraphType {
  AmplitudeVsTime,
}

export const metricSetPairGraphService = buildDelegateService<IMetricSetPairGraph>();
