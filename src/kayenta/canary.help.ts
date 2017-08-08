import { module } from 'angular';

import { HELP_CONTENTS_REGISTRY, HelpContentsRegistry } from '@spinnaker/core';

const helpContents: {[key: string]: string} = {
  'pipeline.config.canary.clusterPairs': `
        <p>A <em>cluster pair</em> is used to create a baseline and canary cluster.</p>' +
        <p>The version currently deployed in the baseline cluster will be used to create a new baseline server group, while the version created in the previous bake or Find AMI stage will be deployed into the canary.</p>`,
  'pipeline.config.canary.resultStrategy': `
        <p>The result stategy is used to determine how to roll up a score if multiple clusters are participating in the canary.</p>
        <p>The <em>lowest</em> strategy means that the cluster with the lowest score is used as the rolled up score</p>
        <p>The <em>average</em> strategy takes the average of all the canary scores</p>`,
  'pipeline.config.canary.delayBeforeAnalysis': '<p>The number of minutes until the first ACA measurement interval begins.</p>',
  'pipeline.config.canary.notificationHours': '<p>Hours at which to send a notification (comma separated)</p>',
  'pipeline.config.canary.canaryInterval': '<p>The frequency at which a canary score is generated.  The recommended interval is at least 30 minutes.</p>',
  'pipeline.config.canary.successfulScore': '<p>The minimum score the canary must achieve to be considered successful.</p>',
  'pipeline.config.canary.unhealthyScore': '<p>The lowest score the canary can attain before it is aborted and disabled as a failure.</p>',
  'pipeline.config.canary.scaleUpCapacity': '<p>The number of instances to which to scale the canary and control clusters.</p>',
  'pipeline.config.canary.scaleUpDelay': '<p>The number of minutes to wait before scaling up the canary.</p>',
  'pipeline.config.canary.baselineVersion': '<p>The Canary stage will inspect the specified cluster to determine which version to deploy as the baseline in each cluster pair.</p>',
  'pipeline.config.canary.lookback': '<p>With an analysis type of <strong>Growing</strong>, ACA will look at the entire duration of the canary for its analysis.</p><p>When choosing <strong>Sliding Lookback</strong>, the canary will use the most recent number of specified minutes for its analysis report (<b>useful for long running canaries that span multiple days</b>).</p>',
  'pipeline.config.canary.continueOnUnhealthy': '<p>Continue the pipeline if the ACA comes back as <b>UNHEALTHY</b></p>',
  'pipeline.config.canary.owner': '<p>The recipient email to which the canary report(s) will be sent.</p>',
  'pipeline.config.canary.watchers': '<p>Comma separated list of additional emails to receive canary reports.  Owners are automatically subscribed to notification emails.</p>',
  'pipeline.config.canary.useGlobalDataset': '<p>Uses the global atlas dataset instead of the region specific dataset for ACA</p>',
  'pipeline.config.canary.marginalScore': `
        <p>A canary stage can include multiple canary runs.</p>
        <p>If a given canary run score is less than or equal to the marginal threshold, the canary stage will fail immediately.</p>
        <p>If the canary run score is greater than the marginal threshold, the canary stage will not fail and will execute the remaining downstream canary runs.</p>`,
  'pipeline.config.canary.passingScore': '<p>When all canary runs in a stage have executed, a canary stage is considered a success if the final (that is, the latest) canary run score is greater than or equal to the pass threshold. Otherwise, it is a failure.</p>',
};

export const CANARY_HELP = 'spinnaker.kayenta.help.contents';
module(CANARY_HELP, [HELP_CONTENTS_REGISTRY])
  .run((helpContentsRegistry: HelpContentsRegistry) => {
    Object.keys(helpContents).forEach(key => helpContentsRegistry.register(key, helpContents[key]));
  });
