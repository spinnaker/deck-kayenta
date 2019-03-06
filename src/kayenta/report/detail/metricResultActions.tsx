import * as React from 'react';
// import { connect, Dispatch } from 'react-redux';
import * as classnames from 'classnames';
import { CopyToClipboard } from '@spinnaker/core';

// import { ICanaryState } from 'kayenta/reducers';
// import * as Creators from 'kayenta/actions/creators';
import './metricResultActions.less';

// interface IGraphTypeSelectorStateProps {
//   selected: GraphType;
// }
//
// interface IGraphTypeSelectorDispatchProps {
//   selectGraphType: (type: GraphType) => void;
// }

const MetricResultActions = () => {
  const actions = [
    <button className="primary">
      <i className="far fa-clipboard" />
      {'Copy this Metric URL'}
    </button>,
    <button className="primary">
      <i className="fas fa-chart-line" />
      {'Explore More Data in Atlas'}
    </button>,
    <CopyToClipboard displayText={false} text={'test'} toolTip={'copy atlas url'} />,
  ].map(action => {
    return <li className={'action'}>{action}</li>;
  });

  return (
    <div>
      <ul className={classnames('actions-layout', 'list-inline')}>{actions}</ul>
    </div>
  );
};

// const GraphTypeSelector = ({
//   selected,
//   selectGraphType,
// }: IGraphTypeSelectorStateProps & IGraphTypeSelectorDispatchProps) => {
//   return (
//     <ul className="list-inline">
//       <li>
//         <label className="label uppercase color-text-primary" style={{ paddingLeft: 0 }}>
//           Graph:
//         </label>
//       </li>
//       {Object.values(GraphType).map(type => (
//         <li
//           style={selected === type ? { textDecoration: 'underline' } : null}
//           key={type}
//           onClick={() => selectGraphType(type)}
//         >
//           <a className="small clickable">{type}</a>
//         </li>
//       ))}
//     </ul>
//   );
// };

// const mapStateToProps = (state: ICanaryState): IGraphTypeSelectorStateProps => ({
//   selected: state.selectedRun.graphType,
// });
//
// const mapDispatchToProps = (dispatch: Dispatch<ICanaryState>): IGraphTypeSelectorDispatchProps => ({
//   selectGraphType: (type: GraphType) => dispatch(Creators.selectGraphType({ type })),
// });
//
// export default connect(
//   mapStateToProps,
//   mapDispatchToProps,
// )(GraphTypeSelector);

export default MetricResultActions;
