interface IColorConfig {
  [propName: string]: string;
}

interface ITimeSeriesConfig {
  [propName: string]: number;
}

interface IVizConfig {
  readonly colors: IColorConfig;
  readonly height: number;
  readonly timeSeries: ITimeSeriesConfig;
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
    minimapHeight: 40,
    differenceAreaHeight: 80,
    differenceAreaHeaderHeight: 37,
  },
};
