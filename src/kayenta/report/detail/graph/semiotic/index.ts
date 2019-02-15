import { GraphType, metricSetPairGraphService } from '../metricSetPairGraph.service';
import SemioticGraph from './graph';

const supportedGraphTypes: GraphType[] = [GraphType.TimeSeries2, GraphType.Histogram2, GraphType.BoxPlot];
// Semiotic component registration
metricSetPairGraphService.register({
  name: 'semiotic',
  handlesGraphType: type => supportedGraphTypes.includes(type),
  getGraph: () => SemioticGraph,
});
