import * as Creators from 'kayenta/actions/creators';
import { CanarySettings } from 'kayenta/canary.settings';
import { DISABLE_EDIT_CONFIG, DisableableInput, DisableableReactSelect } from 'kayenta/layout/disableable';
import FormRow from 'kayenta/layout/formRow';
import { ICanaryState } from 'kayenta/reducers';
import * as React from 'react';
import { connect } from 'react-redux';
import { Option } from 'react-select';
import { Action } from 'redux';

interface IJudgeSelectStateProps {
  judgeOptions: Option[];
  selectedJudge: string;
  renderState: JudgeSelectRenderState;
}

interface IJudgeSelectDispatchProps {
  handleJudgeSelect: (option: Option) => void;
}

export enum JudgeSelectRenderState {
  Multiple,
  Single,
  None,
}

/*
 * Select field for picking canary judge.
 */
function JudgeSelect({
  judgeOptions,
  selectedJudge,
  handleJudgeSelect,
  renderState,
}: IJudgeSelectStateProps & IJudgeSelectDispatchProps) {
  switch (renderState) {
    case JudgeSelectRenderState.Multiple:
      return (
        <FormRow>
          <DisableableReactSelect
            value={selectedJudge}
            options={judgeOptions}
            clearable={false}
            onChange={handleJudgeSelect}
            disabled={CanarySettings.disableConfigEdit}
            disabledStateKeys={[DISABLE_EDIT_CONFIG]}
          />
        </FormRow>
      );
    case JudgeSelectRenderState.Single:
      return (
        <FormRow>
          <DisableableInput
            type="text"
            value={selectedJudge}
            disabled={true}
            disabledStateKeys={[DISABLE_EDIT_CONFIG]}
          />
        </FormRow>
      );
    case JudgeSelectRenderState.None:
      return null;
  }
}

function mapStateToProps(state: ICanaryState): IJudgeSelectStateProps {
  return {
    judgeOptions: (state.data.judges || []).map((judge) => ({ value: judge.name, label: judge.name })),
    selectedJudge: state.selectedConfig.judge.judgeConfig.name,
    renderState: state.selectedConfig.judge.renderState,
  };
}

function mapDispatchToProps(dispatch: (action: Action & any) => void): IJudgeSelectDispatchProps {
  return {
    handleJudgeSelect: (option: Option) => {
      dispatch(Creators.selectJudgeName({ judge: { name: option.value as string } }));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(JudgeSelect);
