import * as React from 'react';

export interface IFormListProps {
  children: JSX.Element[];
}

/*
* Mostly exists to centralize styles for form components.
* */
export default function FormList({ children }: IFormListProps) {
  return (
    <ul className="list-group">
      {children.map((c, i) =>
        <li key={i} className="list-group-item">
          <form role="form" className="form-horizontal container-fluid">
            <div className="col-md-11">{c}</div>
          </form>
        </li>
      )}
    </ul>
  );
}
