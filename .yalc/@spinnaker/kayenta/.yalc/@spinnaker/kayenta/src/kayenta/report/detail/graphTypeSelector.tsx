import * as Creators from 'kayenta/actions/creators';
import { ICanaryState } from 'kayenta/reducers';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';

import { GraphType } from './graph/metricSetPairGraph.service';

import './graphTypeSelector.less';

interface IGraphTypeSelectorStateProps {
  selected: GraphType;
}

interface IGraphTypeSelectorDispatchProps {
  selectGraphType: (type: GraphType) => void;
}

const GraphTypeSelector = ({
  selected,
  selectGraphType,
}: IGraphTypeSelectorStateProps & IGraphTypeSelectorDispatchProps) => {
  return (
    <ul className="list-inline graph-type-selector">
      <li>
        <label className="label uppercase color-text-primary" style={{ paddingLeft: 0 }}>
          Graph:
        </label>
      </li>
      {Object.values(GraphType).map((type) => (
        <li
          style={selected === type ? { textDecoration: 'underline' } : null}
          key={type}
          onClick={() => selectGraphType(type)}
        >
          <a className="small clickable">{type}</a>
        </li>
      ))}
    </ul>
  );
};

const mapStateToProps = (state: ICanaryState): IGraphTypeSelectorStateProps => ({
  selected: state.selectedRun.graphType,
});

const mapDispatchToProps = (dispatch: Dispatch<ICanaryState>): IGraphTypeSelectorDispatchProps => ({
  selectGraphType: (type: GraphType) => dispatch(Creators.selectGraphType({ type })),
});

export default connect(mapStateToProps, mapDispatchToProps)(GraphTypeSelector);
