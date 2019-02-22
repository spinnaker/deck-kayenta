interface IVizConfig {
  readonly colors: any;
  readonly height: number;
}

export const vizConfig: IVizConfig = {
  colors: {
    baseline: '#52b3d9',
    canary: '#e26a6a',
  },
  height: 450,
};
