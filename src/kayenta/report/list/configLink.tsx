import * as React from 'react';
import { connect } from 'react-redux';
import { UISref } from '@uirouter/react';
import { ICanaryState } from 'kayenta/reducers';
import { resolveConfigIdFromExecutionId } from 'kayenta/selectors';

interface IConfigLinkOwnProps {
  configName: string;
  executionId: string;
  application: string;
}

interface IConfigLinkStateProps {
  configId: string;
}

export const ConfigLink = ({ configId, configName }: IConfigLinkOwnProps & IConfigLinkStateProps) => {
  return (
    <UISref
      to="^.^.canaryConfig.configDetail"
      params={{
        id: configId,
      }}
    >
      <a>{configName}</a>
    </UISref>
  );
};

const mapStateToProps = (
  state: ICanaryState,
  ownProps: IConfigLinkOwnProps,
): IConfigLinkStateProps & IConfigLinkOwnProps => {
  return {
    configId: resolveConfigIdFromExecutionId(state, ownProps.executionId),
    ...ownProps,
  };
};

export default connect(mapStateToProps)(ConfigLink);
