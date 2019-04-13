///<reference path="./declarations/react-container-dimensions.d.ts" />

import * as React from 'react';
import ContainerDimensions from 'react-container-dimensions';

import { IMetricSetPairGraphProps, GraphType } from '../metricSetPairGraph.service';
import TimeSeries from './timeSeries';
import Histogram from './histogram';
import BoxPlot from './boxplot';
import './semioticGraph.less';

export default class SemioticGraph extends React.Component<IMetricSetPairGraphProps> {
  private fetchChart = (parentWidth: number) => {
    const { type } = this.props;
    const chartProps = {
      ...this.props,
      parentWidth,
    };

    switch (type) {
      case GraphType.TimeSeries2:
        return <TimeSeries {...chartProps} />;
        break;
      case GraphType.Histogram2:
        return <Histogram {...chartProps} />;
        break;
      case GraphType.BoxPlot:
        return <BoxPlot {...chartProps} />;
        break;
      default:
        return null;
    }
  };

  public render() {
    const containerStyle = {};
    return (
      <div style={containerStyle} className={'semiotic-graph'}>
        <ContainerDimensions>{({ width }: { width: number }) => this.fetchChart(width)}</ContainerDimensions>
      </div>
    );
  }
}
