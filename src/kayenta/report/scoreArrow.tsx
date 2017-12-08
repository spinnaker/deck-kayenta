import * as React from 'react';
import * as classNames from 'classnames';

const ARROW_CLASS = 'arrow-down';

export interface IScoreArrowProps {
  borderTopColor: string;
  className?: string;
}

export default ({ borderTopColor, className }: IScoreArrowProps) => (
  <div className={classNames(ARROW_CLASS, className)} style={{ borderTopColor }}/>
);
