import * as React from 'react';

export type IDelegateConfig<T, U = React.ComponentClass> = {
  [K in keyof T]: U;
};

export interface IDelegateService<T> {
  register: (name: string, config: IDelegateConfig<T>) => void;
  getDelegate: (name: string) => IDelegateConfig<T>;
}

export function delegateServiceFactory<T extends IDelegateConfig<T>>(): IDelegateService<T> {
  class DelegateService implements IDelegateService<T> {
    private configs = new Map<string, T>();

    public register(name: string, config: T): void {
      this.configs.set(name, config);
    }

    public getDelegate(name: string): T {
      return this.configs.get(name);
    }
  }
  return new DelegateService();
}

export interface IDelegateComponentProps<T> {
  name: string;
  property: keyof T;
}

export function delegateComponentFactory<T extends IDelegateConfig<T>>(service: IDelegateService<T>) {
  return ({ name, property }: IDelegateComponentProps<T>) => {
    const config = service.getDelegate(name);
    if (config && config[property]) {
      const DelegateComponent = config[property];
      return <DelegateComponent/>;
    } else {
      // Could do better here - the delegate service factory could allow you to pass a default component.
      return (
        <p>
          {`'${property}' not yet implemented for '${name}'.`}
        </p>
      );
    }
  }
}
