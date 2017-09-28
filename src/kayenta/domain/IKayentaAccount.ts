export interface IKayentaAccount {
  name: string;
  type: string;
  supportedTypes: Type[];
}

export enum Type {
  MetricsStore = 'METRICS_STORE',
  ObjectStore = 'OBJECT_STORE',
  ConfigurationStore = 'CONFIGURATION_STORE',
}
