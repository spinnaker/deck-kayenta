import classNames from 'classnames';
import { ICanaryState } from 'kayenta/reducers';
import { get, omit } from 'lodash';
import * as React from 'react';
import { Typeahead, TypeaheadProps } from 'react-bootstrap-typeahead';
import { connect } from 'react-redux';
import Select, { ReactSelectProps } from 'react-select';

// Well-known keys that flag if a component should be disabled.
export const DISABLE_EDIT_CONFIG = 'app.disableConfigEdit';

interface IDisableable {
  disabled?: boolean;
}

interface IDisableableStateProps {
  disabledBecauseOfState: boolean;
}

interface IDisableableOwnProps {
  disabledStateKeys: string[];
}

const mapStateToProps = (state: ICanaryState, ownProps: IDisableableOwnProps) => ({
  disabledBecauseOfState: (ownProps.disabledStateKeys || []).some((key) => get<boolean>(state, key, false)),
});

// A component wrapped in `disableable` is disabled if one of the keys passed
// through `disabledStateKeys` returns true when checked against the Redux store.
function disableable<T extends IDisableable>(Component: React.SFC<T>) {
  return connect(mapStateToProps)((props: T & IDisableable & IDisableableStateProps) => {
    const { disabled, disabledBecauseOfState } = props;

    // Would use object spread except for weird interaction with TS generics.
    const otherProps: T = omit(props, ['disabled', 'disabledBecauseOfState', 'disabledStateKeys', 'dispatch']);
    return <Component {...otherProps} disabled={disabled || disabledBecauseOfState} />;
  });
}

type IDisableableButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;
export const DisableableButton = disableable<IDisableableButtonProps>((props) => {
  const { children, ...otherProps } = props;
  return <button {...otherProps}>{children}</button>;
});

type IDisableableInputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
export const DisableableInput = disableable<IDisableableInputProps>((props) => {
  const { className, ...inputProps } = props;
  return (
    <input
      {...inputProps}
      className={classNames(className, {
        'form-control': !['radio', 'checkbox'].includes(inputProps.type),
        'input-sm': !['radio', 'checkbox'].includes(inputProps.type),
      })}
    />
  );
});

export const DisableableReactSelect = disableable<ReactSelectProps>((props) => {
  const { children, ...selectProps } = props;
  return <Select {...selectProps}>{children}</Select>;
});

export const DisableableReactTypeahead = disableable<TypeaheadProps<any>>((props) => {
  const { children, ...selectProps } = props;
  return <Typeahead {...selectProps}>{children}</Typeahead>;
});

type IDisableableSelectProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
export const DisableableSelect = disableable<IDisableableSelectProps>((props) => {
  const { children, ...selectProps } = props;
  return <select {...selectProps}>{children}</select>;
});

// TODO(dpeach): why do I have to type `rows` explicitly here?
type IDisableableTextareaProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
> & { rows?: number };
export const DisableableTextarea = disableable<IDisableableTextareaProps>((props) => {
  const { className, ...textareaProps } = props;
  return <textarea className={classNames('form-control', 'input-sm', className)} {...textareaProps} />;
});
