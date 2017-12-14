import * as React from 'react';
import * as classNames from 'classnames';

import { ITableColumn } from './tableColumn';
import { TableHeader } from './tableHeader';

export interface ITableProps<T> {
  data: T[];
  columns: ITableColumn<T>[];
  rowKey: (row: T) => string;
  headerClassName: string;
  rowClassName: string;
}

export function Table<T>({ data, columns, rowKey, headerClassName, rowClassName }: ITableProps<T>) {
  return (
    <div>
      <TableHeader columns={columns} className={headerClassName}/>
      <ul className="list-group">
        {
          data.map(d => (
            <div key={rowKey(d)} className={classNames('horizontal', rowClassName)}>
              {
                columns.map((c, i) => (
                  <div key={c.label || i} className={`flex-${c.width}`}>
                    {!c.hide && c.getContent(d)}
                  </div>
                ))
              }
            </div>
          ))
        }
      </ul>
    </div>
  );
}

