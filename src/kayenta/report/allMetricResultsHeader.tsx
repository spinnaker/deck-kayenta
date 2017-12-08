import * as React from 'react';
import * as classNames from 'classnames';

import ScoreArrow from './scoreArrow';

export interface IAllMetricResultsHeader {
  onClick: () => void;
  className?: string;
}

/*
* Clickable header for all metric results.
*/
export default ({ className, onClick }: IAllMetricResultsHeader) => (
  <section className={classNames(className, 'clickable')}>
    <div
      onClick={onClick}
      className={classNames('clickable', 'text-center', 'all-metric-results-header')}
    >
      <h3 className="heading-3 uppercase label">all</h3>
      <ScoreArrow className="outer" borderTopColor="var(--color-titanium)"/>
      <ScoreArrow className="inner" borderTopColor="var(--color-alabaster)"/>
    </div>
  </section>
);
