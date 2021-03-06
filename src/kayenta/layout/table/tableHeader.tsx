import classNames from 'classnames';
import * as React from 'react';

import { ITableColumn } from './tableColumn';

export interface ITableHeaderProps {
  columns: Array<ITableColumn<any>>;
  className: string;
}

export const TableHeader = ({ columns, className }: ITableHeaderProps) => {
  return (
    <div className={classNames('horizontal', className)}>
      {columns.map((c, i) => (
        <div key={c.label || i} className={`flex-${c.width}`}>
          {!c.hide && (
            <h6 className={classNames('heading-6', 'uppercase', 'color-text-primary', c.labelClassName)}>{c.label}</h6>
          )}
        </div>
      ))}
    </div>
  );
};
