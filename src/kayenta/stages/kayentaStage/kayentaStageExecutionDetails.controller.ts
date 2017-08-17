import { IScope, module } from 'angular';
import { StateParams } from '@uirouter/angularjs';

import { ExecutionDetailsSectionService } from '@spinnaker/core';

class KayentaStageExecutionDetailsController {

  constructor(public $scope: IScope,
              private $stateParams: StateParams,
              private executionDetailsSectionService: ExecutionDetailsSectionService) {
    'ngInject';
    this.$scope.configSections = ['canarySummary', 'taskStatus'];
    this.$scope.$on('$stateChangeSuccess', () => this.initialize());
  }

  public $onInit(): void {
    this.initialize();
  }

  private initialize(): void {
    this.executionDetailsSectionService.synchronizeSection(this.$scope.configSections, () => this.initialized());
  }

  private initialized(): void {
    this.$scope.detailsSection = this.$stateParams.details;
  }
}

export const KAYENTA_STAGE_EXECUTION_DETAILS_CONTROLLER = 'spinnaker.kayenta.kayentaStageExecutionDetails.controller';
module(KAYENTA_STAGE_EXECUTION_DETAILS_CONTROLLER, [])
  .controller('kayentaStageExecutionDetailsCtrl', KayentaStageExecutionDetailsController);
