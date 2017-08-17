import { module } from 'angular';

import {
  Application, IExecution, IExecutionStage, ITransformer, ORCHESTRATED_ITEM_TRANSFORMER,
  OrchestratedItemTransformer
} from '@spinnaker/core';

export class KayentaStageTransformer implements ITransformer {

  constructor(private orchestratedItemTransformer: OrchestratedItemTransformer) {
    'ngInject';
  }

  public transform(_application: Application, execution: IExecution): void {
    let stagesToRenderAsTasks: IExecutionStage[] = [];
    execution.stages.forEach(stage => {
      if (stage.type === 'kayentaCanary') {
        this.orchestratedItemTransformer.defineProperties(stage);
        stage.exceptions = this.getException(stage) ? [`Canary failure: ${this.getException(stage)}`] : [];

        stagesToRenderAsTasks = execution.stages.filter(s => s.parentStageId === stage.id);
        this.addExceptions(stagesToRenderAsTasks, stage.exceptions);

        // For now, a 'kayentaCanary' stage should only have an 'aggregateCanaryResults' task, which should definitely go last.
        stage.tasks = [...stagesToRenderAsTasks, ...stage.tasks];
      }
    });

    execution.stages = execution.stages.filter(stage => !stagesToRenderAsTasks.includes(stage));
  }

  private addExceptions(stages: IExecutionStage[], exceptions: string[]): void {
    stages.forEach(stage => {
      this.orchestratedItemTransformer.defineProperties(stage);
      if (this.getException(stage)) {
        exceptions.push(this.getException(stage));
      }
      if (stage.isFailed && stage.context && stage.context.canaryScoreMessage) {
        exceptions.push(stage.context.canaryScoreMessage);
      }
    });
  }

  private getException(stage: IExecutionStage): string {
    return stage && stage.isFailed ? stage.failureMessage : null;
  }
}

export const KAYENTA_STAGE_TRANSFORMER = 'spinnaker.kayenta.kayentaStageTransformer';
module(KAYENTA_STAGE_TRANSFORMER, [
  ORCHESTRATED_ITEM_TRANSFORMER,
]).service('kayentaStageTransformer', KayentaStageTransformer);
