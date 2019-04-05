interface IVizConfig {
  readonly colors: any;
  readonly height: number;
}

export const vizConfig: IVizConfig = {
  colors: {
    baseline: '#52b3d9',
    canary: '#e26a6a',
    background: '#f8f8f8',
  },
  height: 450,
};
