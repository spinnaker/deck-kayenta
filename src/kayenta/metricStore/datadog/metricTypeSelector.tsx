import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import Select, { Option } from 'react-select';
import { ICanaryState } from 'kayenta/reducers';
import { IDatadogMetricDescriptor } from './domain/IDatadogMetricDescriptor';
import { AsyncRequestState } from 'kayenta/reducers/asyncRequest';
import * as Creators from 'kayenta/actions/creators';

interface IDatadogMetricTypeSelectorDispatchProps {
  load: (filter: string) => void;
}

interface IDatadogMetricTypeSelectorStateProps {
  options: Option[]
  loading: boolean;
}

interface IDatadogMetricTypeSelectorOwnProps {
  value: string;
  onChange: (option: Option) => void;
}

const DatadogMetricTypeSelector = ({ loading, load, options, value, onChange }: IDatadogMetricTypeSelectorDispatchProps & IDatadogMetricTypeSelectorStateProps & IDatadogMetricTypeSelectorOwnProps) => {
  if (value && options.every(o => o.value !== value)) {
    options = options.concat({ label: value, value });
  }

  return (
    <Select
      isLoading={loading}
      options={options}
      onChange={onChange}
      value={value}
      placeholder={'Enter at least three characters to search.'}
      onInputChange={
        input => {
          load(input);
          return input;
        }
      }
    />
  );
};

const mapStateToProps = (state: ICanaryState, ownProps: IDatadogMetricTypeSelectorOwnProps) => {
  const descriptors = state.data.metricsServiceMetadata.data as IDatadogMetricDescriptor[];
  const options: Option[] = descriptors.map(d => ({ label: d.type, value: d.type }));
  return {
    options,
    loading: state.data.metricsServiceMetadata.load === AsyncRequestState.Requesting,
    ...ownProps,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<ICanaryState>) => {
  return {
    load: (filter: string) => {
      dispatch(Creators.updateDatadogMetricDescriptorFilter({ filter }));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DatadogMetricTypeSelector);
