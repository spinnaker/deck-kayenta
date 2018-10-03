import * as React from 'react';
import * as classNames from 'classnames';
import { ValidationMessage, HelpField } from '@spinnaker/core';

export default function FormRow({
  label,
  helpId,
  children,
  checkbox,
  error,
}: {
  label?: string | React.ReactFragment;
  helpId?: string;
  children?: any;
  checkbox?: boolean;
  error?: string;
}) {
  return (
    <div className="form-group row">
      <label className="col-sm-2 control-label sm-label-right">
        {label} {helpId && <HelpField id={helpId} />}
      </label>
      <div
        className={classNames('col-sm-10', { checkbox: checkbox })}
        style={checkbox ? { marginTop: '0', marginBottom: '0' } : null}
      >
        {children}
        {error && <ValidationMessage type="error" message={error} />}
      </div>
    </div>
  );
}
