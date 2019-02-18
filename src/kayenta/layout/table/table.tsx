import * as React from 'react';
import * as classNames from 'classnames';

import { ITableColumn } from './tableColumn';
import { TableHeader } from './tableHeader';

export interface ITableProps<T> {
  rows: T[];
  columns: Array<ITableColumn<T>>;
  rowKey: (row: T) => string;
  tableBodyClassName?: string;
  headerClassName?: string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  customRow?: (row: T) => JSX.Element;
  className?: string;
}

export function Table<T>({
  rows,
  columns,
  rowKey,
  tableBodyClassName,
  rowClassName,
  onRowClick,
  customRow,
  className,
  headerClassName,
}: ITableProps<T>) {
  const TableRow = ({ row }: { row: T }) => (
    <li
      onClick={onRowClick ? () => onRowClick(row) : null}
      className={classNames(
        { horizontal: !rowClassName, 'table-row': !rowClassName },
        rowClassName && rowClassName(row),
      )}
    >
      {columns.map((c, i) => (
        <div key={c.label || i} className={`flex-${c.width}`}>
          {!c.hide && c.getContent(row)}
        </div>
      ))}
    </li>
  );

  return (
    <div className={className}>
      <ul className={classNames(tableBodyClassName, 'list-group')}>
        <TableHeader columns={columns} className={classNames('table-header', 'sticky-header', headerClassName)} />
        {rows.map(
          r =>
            customRow && customRow(r) ? (
              <div key={rowKey(r)}>{customRow(r)}</div>
            ) : (
              <TableRow key={rowKey(r)} row={r} />
            ),
        )}
      </ul>
    </div>
  );
}
