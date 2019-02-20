///<reference path="./declarations/semiotic.d.ts" />
///<reference path="./declarations/d3-legend.d.ts" />

import * as React from 'react';
import { scaleOrdinal } from 'd3-scale';
import { select } from 'd3-selection';
import { legendColor } from 'd3-svg-legend';
import { vizConfig } from './config';

// import * as classNames from 'classnames';
//
// import './graph.less';

// export interface IChartProps {
//   domain: string[];
//   range: string[];
// }

export default class ChartLegend extends React.Component {
  componentDidMount() {
    this.generateLegendSVG();
  }

  generateLegendSVG = () => {
    var ordinal = scaleOrdinal()
      .domain(['baseline', 'canary'])
      .range([vizConfig.colors.baseline, vizConfig.colors.canary]);

    var svg = select('.semiotic-legend-svg');

    console.log('svg+++');
    console.log(svg);

    svg
      .append('g')
      .attr('class', 'legendOrdinal')
      .attr('transform', 'translate(20,20)');

    var legendOrdinal = legendColor()
      // .title("A really really really really really long title")
      // .titleWidth(100)

      //d3 symbol creates a path-string, for example
      //"M0,-8.059274488676564L9.306048591020996,
      //8.059274488676564 -9.306048591020996,8.059274488676564Z"
      // .shape("path", d3.symbol().type(d3.symbolTriangle).size(150)())
      // .shapePadding(10)
      .shapeWidth(30)
      .orient('horizontal')
      .shape('line')
      .shapePadding(20)
      .shapeWidth(30)
      //use cellFilter to hide the "e" cell
      // .cellFilter(function(d){ return d.label !== "e" })
      .scale(ordinal);

    console.log('legendOrdinal');
    console.log(legendOrdinal);

    svg.select('.legendOrdinal').call(legendOrdinal);
    console.log('completed+++');
  };

  render() {
    return (
      <div className={'semiotic-legend'}>
        <svg className={'semiotic-legend-svg'} />
      </div>
    );
  }
}

// export default class ChartHeader extends React.Component<IChartHeaderProps> {
//   render(){
//       const {prefix, metric} = this.props
//       return (
//         <div className={'chart-header'}>
//           <span className={classNames('heading-6', 'color-text-primary', 'uppercase', 'prefix')}>
//             {`${prefix} `}
//           </span>
//           <span>&nbsp;{`${metric}`}</span>
//         </div>
//       )
//   }
// }
