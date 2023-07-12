import * as Actions from 'kayenta/actions';
import * as Creators from 'kayenta/actions/creators';
import { ICanaryConfigUpdateResponse, KayentaAccountType } from 'kayenta/domain';
import { ICanaryState } from 'kayenta/reducers';
import { runSelector } from 'kayenta/selectors';
import {
  createCanaryConfig,
  deleteCanaryConfig,
  getCanaryConfigById,
  listKayentaAccounts,
  mapStateToConfig,
  updateCanaryConfig,
} from 'kayenta/service/canaryConfig.service';
import { listMetricsServiceMetadata } from 'kayenta/service/metricsServiceMetadata.service';
import { Action, MiddlewareAPI } from 'redux';
import { combineEpics, createEpicMiddleware, EpicMiddleware } from 'redux-observable';
import { concat, forkJoin, from, Observable, of, Subject } from 'rxjs';
import { catchError, concatMap, debounceTime, filter, map, mapTo, take } from 'rxjs/operators';

import { ReactInjector } from '@spinnaker/core';

import { getCanaryRun, getMetricSetPair } from '../service/canaryRun.service';

const typeMatches = (...actions: string[]) => (action: Action & any) => actions.includes(action.type);

const loadConfigEpic = (action$: Observable<Action & any>) =>
  action$.pipe(
    filter(typeMatches(Actions.LOAD_CONFIG_REQUEST, Actions.SAVE_CONFIG_SUCCESS)),
    concatMap((action) =>
      from(getCanaryConfigById(action.payload.id)).pipe(
        map((config) => Creators.loadConfigSuccess({ config })),
        catchError((error) => of(Creators.loadConfigFailure({ error }))),
      ),
    ),
  );

const selectConfigEpic = (action$: Observable<Action & any>) =>
  action$.pipe(
    filter(typeMatches(Actions.LOAD_CONFIG_SUCCESS)),
    map((action) => Creators.selectConfig({ config: action.payload.config })),
  );

const saveConfigEpic = (action$: Observable<Action & any>, store: MiddlewareAPI<ICanaryState>) =>
  action$.pipe(
    filter(typeMatches(Actions.SAVE_CONFIG_REQUEST)),
    concatMap(() => {
      const config = mapStateToConfig(store.getState());
      let saveAction: PromiseLike<ICanaryConfigUpdateResponse>;
      if (config.isNew) {
        delete config.isNew;
        saveAction = createCanaryConfig(config);
      } else {
        saveAction = updateCanaryConfig(config);
      }

      return from(saveAction).pipe(
        concatMap(({ canaryConfigId }) =>
          forkJoin(
            from(ReactInjector.$state.go('^.configDetail', { id: canaryConfigId, copy: false, new: false })),
            from(store.getState().data.application.getDataSource('canaryConfigs').refresh(true)),
          ).pipe(mapTo(Creators.saveConfigSuccess({ id: canaryConfigId }))),
        ),
        catchError((error: Error) => of(Creators.saveConfigFailure({ error }))),
      );
    }),
  );

const deleteConfigRequestEpic = (action$: Observable<Action & any>, store: MiddlewareAPI<ICanaryState>) =>
  action$.pipe(
    filter(typeMatches(Actions.DELETE_CONFIG_REQUEST)),
    concatMap(() =>
      from(deleteCanaryConfig(store.getState().selectedConfig.config.id)).pipe(
        mapTo(Creators.deleteConfigSuccess()),
        catchError((error: Error) => of(Creators.deleteConfigFailure({ error }))),
      ),
    ),
  );

const deleteConfigSuccessEpic = (action$: Observable<Action & any>, store: MiddlewareAPI<ICanaryState>) =>
  action$.pipe(
    filter(typeMatches(Actions.DELETE_CONFIG_SUCCESS)),
    concatMap(() =>
      forkJoin(
        from(ReactInjector.$state.go('^.configDefault')),
        from(store.getState().data.application.getDataSource('canaryConfigs').refresh(true)),
      ).pipe(mapTo(Creators.closeDeleteConfigModal())),
    ),
  );

const loadCanaryRunRequestEpic = (action$: Observable<Action & any>) =>
  action$.pipe(
    filter(typeMatches(Actions.LOAD_RUN_REQUEST)),
    concatMap((action) =>
      from(getCanaryRun(action.payload.configId, action.payload.runId)).pipe(
        map((run) => Creators.loadRunSuccess({ run })),
        catchError((error: Error) => of(Creators.loadRunFailure({ error }))),
      ),
    ),
  );

const loadMetricSetPairEpic = (action$: Observable<Action & any>, store: MiddlewareAPI<ICanaryState>) =>
  action$.pipe(
    filter(typeMatches(Actions.LOAD_METRIC_SET_PAIR_REQUEST)),
    concatMap((action) => {
      const run = runSelector(store.getState());
      return from(getMetricSetPair(run.metricSetPairListId, action.payload.pairId)).pipe(
        map((metricSetPair) => Creators.loadMetricSetPairSuccess({ metricSetPair })),
        catchError((error: Error) => of(Creators.loadMetricSetPairFailure({ error }))),
      );
    }),
  );

const updatePrometheusMetricDescriptionFilterEpic = (action$: Observable<Action & any>) =>
  action$.pipe(
    filter(typeMatches(Actions.UPDATE_PROMETHEUS_METRIC_DESCRIPTOR_FILTER)),
    filter((action) => action.payload.filter && action.payload.filter.length > 2),
    debounceTime(200 /* milliseconds */),
    map((action) =>
      Creators.loadMetricsServiceMetadataRequest({
        filter: action.payload.filter,
        metricsAccountName: action.payload.metricsAccountName,
      }),
    ),
  );

const updateStackdriverMetricDescriptionFilterEpic = (
  action$: Observable<Action & any>,
  store: MiddlewareAPI<ICanaryState>,
) =>
  action$.pipe(
    filter(typeMatches(Actions.UPDATE_STACKDRIVER_METRIC_DESCRIPTOR_FILTER)),
    filter((action) => action.payload.filter && action.payload.filter.length > 2),
    debounceTime(200 /* milliseconds */),
    map((action) => {
      const [metricsAccountName] = store
        .getState()
        .data.kayentaAccounts.data.filter(
          (account) =>
            account.supportedTypes.includes(KayentaAccountType.MetricsStore) &&
            account.metricsStoreType === 'stackdriver',
        )
        .map((account) => account.name);

      return Creators.loadMetricsServiceMetadataRequest({
        filter: action.payload.filter,
        metricsAccountName,
      });
    }),
  );

const updateGraphiteMetricDescriptionFilterEpic = (
  action$: Observable<Action & any>,
  store: MiddlewareAPI<ICanaryState>,
) =>
  action$.pipe(
    filter(typeMatches(Actions.UPDATE_GRAPHITE_METRIC_DESCRIPTOR_FILTER)),
    filter((action) => action.payload.filter && action.payload.filter.length > 2),
    debounceTime(200 /* milliseconds */),
    map((action) => {
      const [metricsAccountName] = store
        .getState()
        .data.kayentaAccounts.data.filter(
          (account) => account.supportedTypes.includes(KayentaAccountType.MetricsStore) && account.type === 'graphite',
        )
        .map((account) => account.name);

      return Creators.loadMetricsServiceMetadataRequest({
        filter: action.payload.filter,
        metricsAccountName,
      });
    }),
  );

const updateDatadogMetricDescriptionFilterEpic = (
  action$: Observable<Action & any>,
  store: MiddlewareAPI<ICanaryState>,
) =>
  action$.pipe(
    filter(typeMatches(Actions.UPDATE_DATADOG_METRIC_DESCRIPTOR_FILTER)),
    filter((action) => action.payload.filter && action.payload.filter.length > 2),
    debounceTime(200 /* milliseconds */),
    map((action) => {
      const [metricsAccountName] = store
        .getState()
        .data.kayentaAccounts.data.filter(
          (account) => account.supportedTypes.includes(KayentaAccountType.MetricsStore) && account.type === 'datadog',
        )
        .map((account) => account.name);

      return Creators.loadMetricsServiceMetadataRequest({
        filter: action.payload.filter,
        metricsAccountName,
      });
    }),
  );

const loadMetricsServiceMetadataEpic = (action$: Observable<Action & any>) =>
  action$.pipe(
    filter(typeMatches(Actions.LOAD_METRICS_SERVICE_METADATA_REQUEST)),
    concatMap((action) =>
      from(listMetricsServiceMetadata(action.payload.filter, action.payload.metricsAccountName)).pipe(
        map((data) => Creators.loadMetricsServiceMetadataSuccess({ data })),
        catchError((error: Error) => of(Creators.loadMetricsServiceMetadataFailure({ error }))),
      ),
    ),
  );

const loadKayentaAccountsEpic = (action$: Observable<Action & any>) =>
  action$.pipe(
    filter(typeMatches(Actions.LOAD_KAYENTA_ACCOUNTS_REQUEST, Actions.INITIALIZE)),
    concatMap(() =>
      from(listKayentaAccounts()).pipe(
        map((accounts) => Creators.loadKayentaAccountsSuccess({ accounts })),
        catchError((error: Error) => of(Creators.loadKayentaAccountsFailure({ error }))),
      ),
    ),
  );

const rootEpic = combineEpics(
  loadConfigEpic,
  selectConfigEpic,
  saveConfigEpic,
  deleteConfigRequestEpic,
  deleteConfigSuccessEpic,
  loadCanaryRunRequestEpic,
  loadMetricSetPairEpic,
  updateGraphiteMetricDescriptionFilterEpic,
  updatePrometheusMetricDescriptionFilterEpic,
  updateStackdriverMetricDescriptionFilterEpic,
  updateDatadogMetricDescriptionFilterEpic,
  loadMetricsServiceMetadataEpic,
  loadKayentaAccountsEpic,
);

export const epicMiddleware: EpicMiddleware<Action & any, ICanaryState> = createEpicMiddleware(rootEpic);
