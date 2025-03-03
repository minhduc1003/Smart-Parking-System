import { all, call, put, takeLatest } from "redux-saga/effects";
import { ReduxActionTypes } from "../reduxActionConstants";
import { loginApi } from "@/api/userApi";
import { AxiosResponse } from "axios";
import * as SecureStore from "expo-secure-store";
export function* loginSaga(action: {
  payload: any;
  type: string;
}): Generator<any, void, AxiosResponse> {
  try {
    const { email, password } = action.payload;
    const response: AxiosResponse<any> = yield call(loginApi, email, password);
    yield SecureStore.setItemAsync("secure_token", response.data.token);
    yield put({ type: ReduxActionTypes.LOGIN_SUCCESS, payload: response.data });
  } catch (error) {
    yield put({ type: ReduxActionTypes.LOGIN_ERROR, payload: error });
  }
}

export default function* userSagas() {
  yield all([takeLatest(ReduxActionTypes.LOGIN, loginSaga)]);
}
