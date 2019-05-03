///<reference path="./declarations/react-container-dimensions.d.ts" />

import * as React from 'react';
import ContainerDimensions from 'react-container-dimensions';

import { IMetricSetPairGraphProps, GraphType } from '../metricSetPairGraph.service';
import TimeSeries from './timeSeries';
import Histogram from './histogram';
import BoxPlot from './boxplot';
import NoDataSign from './noDataSign';
import './semioticGraph.less';

export default class SemioticGraph extends React.Component<IMetricSetPairGraphProps> {
  private fetchChart = (parentWidth: number) => {
    const {
      type,
      metricSetPair: {
        values: { control, experiment },
      },
    } = this.props;
    const chartProps = {
      ...this.props,
      parentWidth,
    };
    console.log('test...');
    console.log(this.props.metricSetPair);
    const filterInvalidValues = (data: number[]) => data.filter(v => typeof v === 'number');

    if (filterInvalidValues(control).length === 0 && filterInvalidValues(experiment).length === 0) {
      return <NoDataSign />;
    }

    switch (type) {
      case GraphType.TimeSeries:
        return <TimeSeries {...chartProps} />;
        break;
      case GraphType.Histogram:
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
    return (
      <div className="semiotic-graph">
        <ContainerDimensions>{({ width }: { width: number }) => this.fetchChart(width)}</ContainerDimensions>
      </div>
    );
  }
}
