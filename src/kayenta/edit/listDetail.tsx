import * as React from 'react';
import * as classNames from 'classnames';

interface IListDetailProps {
  className?: string,
  list: JSX.Element,
  detail: JSX.Element
}

/*
 * A composite view that combines a list view in one panel and a detail view in another.
 * The contents of the detail view are dependent on the user's selection in the list view.
 */
export default function ListDetail({ className, list, detail }: IListDetailProps) {
  return (
    <div className={classNames('horizontal', 'container', className)}>
      <div className="flex-1">
        {list}
      </div>
      <div className="flex-4">
        {detail}
      </div>
    </div>
  );
}
