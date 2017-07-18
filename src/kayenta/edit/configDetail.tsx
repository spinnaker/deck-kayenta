import * as React from 'react';

import ConfigDetailHeader from './configDetailHeader';
import GroupTabs from './groupTabs';
import MetricList from './metricList';

/*
 * Top-level config detail layout
 */
export default function ConfigDetail() {
  return (
    <section>
      <ConfigDetailHeader/>
      <GroupTabs/>
      <MetricList/>
    </section>
  );
}
