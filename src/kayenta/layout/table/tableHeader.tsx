import * as React from 'react';
import * as classNames from 'classnames';

import { ITableColumn } from './tableColumn';

export interface ITableHeaderProps {
  columns: ITableColumn<any>[];
  className: string;
}

export const TableHeader = ({ columns, className }: ITableHeaderProps) => {
  return (
    <section className={classNames('horizontal', className)}>
      {columns.map(c => (
        <div className={`flex-${c.width}`}>
          <h6 className="heading-6 uppercase color-text-primary">{c.label}</h6>
        </div>
      ))}
    </section>
  );
};