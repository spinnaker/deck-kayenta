interface IStringConfig {
  [propName: string]: string;
}

interface INumberConfig {
  [propName: string]: number;
}

interface IVizConfig {
  readonly colors: IStringConfig;
  readonly height: number;
  readonly timeSeries: INumberConfig;
}

export const vizConfig: IVizConfig = {
  colors: {
    baseline: '#52b3d9',
    canary: '#e26a6a',
    background: '#f8f8f8',
  },
  height: 400,
  timeSeries: {
    minimapDataPointsThreshold: 240,
    differenceAreaHeight: 60,
    differenceAreaHeaderHeight: 37,
  },
};
