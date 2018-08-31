export interface ICanaryConfig {
  applications: string[];
  id?: string;
  createdTimestamp?: number;
  updatedTimestamp?: number;
  createdTimestampIso?: string;
  updatedTimestampIso?: string;
  isNew?: boolean;
  name: string;
  description: string;
  configVersion: string;
  metrics: ICanaryMetricConfig[];
  templates: {[key: string]: string};
  classifier: ICanaryClassifierConfig;
  judge: ICanaryJudgeConfig;
}

export interface ICanaryMetricConfig {
  id: string;
  name: string;
  query: ICanaryMetricSetQueryConfig;
  groups: string[];
  analysisConfigurations: {
    [key: string]: any;
    effectSize?: ICanaryMetricEffectSizeConfig;
  };
  scopeName: string;
  isNew?: boolean;
}

export interface ICanaryMetricSetQueryConfig {
  [key: string]: any;
  type: string;
  serviceType: string;
  customFilter?: string;
  customFilterTemplate?: string;
}

export type IGroupWeights = {[group: string]: number};

export interface ICanaryClassifierConfig {
  groupWeights: IGroupWeights;
  scoreThresholds: ICanaryClassifierThresholdsConfig;
}

export interface ICanaryClassifierThresholdsConfig {
  pass: number;
  marginal: number;
}

export interface ICanaryMetricEffectSizeConfig {
  allowedIncrease?: number;
  allowedDecrease?: number;
  criticalIncrease?: number;
  criticalDecrease?: number;
}

export interface ICanaryJudgeConfig {
  name: string;
  judgeConfigurations: {[key: string]: any};
}
