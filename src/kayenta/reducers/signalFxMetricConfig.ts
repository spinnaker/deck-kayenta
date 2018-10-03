import { Action } from 'redux';
import { handleActions } from 'redux-actions';

import * as Actions from 'kayenta/actions';
import { IUpdateKeyValueListPayload, updateListReducer } from '../layout/keyValueList';
import { ISignalFxCanaryMetricSetQueryConfig } from 'kayenta/metricStore/signalfx/domain/ISignalFxCanaryMetricSetQueryConfig';
import { IKayentaAction } from '../actions/creators';

const updateQueryPairsReducer = updateListReducer();

export const signalFxMetricConfigReducer = handleActions<ISignalFxCanaryMetricSetQueryConfig, Action & any>({
  [Actions.UPDATE_SIGNAL_FX_QUERY_PAIRS]: (state: ISignalFxCanaryMetricSetQueryConfig, action: IKayentaAction<IUpdateKeyValueListPayload>) => ({
    ...state,
    query: {
      ...state.query,
      queryPairs: updateQueryPairsReducer(state.query.queryPairs || [], action)
    }
  })
}, null);
