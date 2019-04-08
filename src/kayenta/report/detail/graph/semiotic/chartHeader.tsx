import * as React from 'react';
import * as classNames from 'classnames';

import './graph.less';

export interface IChartHeaderProps {
  metric: string;
}

export default ({ metric }: IChartHeaderProps) => {
  return (
    <div className={'chart-header'}>
      <h6 className={classNames('heading-6', 'color-text-primary')}>
        {/*<span className={classNames('uppercase', 'prefix')}>{`${prefix} `}</span>*/}
        <span className={classNames('uppercase', 'prefix')}>{`metric name:`}</span>
        <span>
          &nbsp;
          {`${metric}`}
        </span>
      </h6>
    </div>
  );
};
