import { all, call, put, takeLatest } from "redux-saga/effects";
import { ReduxActionTypes } from "../reduxActionConstants";
import {
  depositApi,
  getUserApi,
  loginApi,
  registerApi,
  withdrawApi,
} from "@/api/userApi";
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
export function* registerSaga(action: {
  payload: any;
  type: string;
}): Generator<any, void, AxiosResponse> {
  try {
    const { email, name, password, numberPlate } = action.payload;
    const response: AxiosResponse<any> = yield call(
      registerApi,
      email,
      name,
      password,
      numberPlate
    );
    yield put({
      type: ReduxActionTypes.REGISTER_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    yield put({ type: ReduxActionTypes.REGISTER_ERROR, payload: error });
  }
}
export function* depositSaga(action: {
  payload: any;
  type: string;
}): Generator<any, void, AxiosResponse> {
  try {
    const { userId, amount } = action.payload;
    const response: AxiosResponse<any> = yield call(depositApi, userId, amount);
    yield put({
      type: ReduxActionTypes.DEPOSIT_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    yield put({ type: ReduxActionTypes.DEPOSIT_ERROR, payload: error });
  }
}
export function* withdrawSaga(action: {
  payload: any;
  type: string;
}): Generator<any, void, AxiosResponse> {
  try {
    const { userId, amount } = action.payload;
    const response: AxiosResponse<any> = yield call(
      withdrawApi,
      userId,
      amount
    );
    yield put({
      type: ReduxActionTypes.WITHDRAW_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    yield put({ type: ReduxActionTypes.WITHDRAW_ERROR, payload: error });
  }
}
export function* getUserSaga(): Generator<any, void, AxiosResponse> {
  try {
    const response: AxiosResponse<any> = yield call(getUserApi);
    console.log("getUserSaga response", response.data);
    yield put({
      type: ReduxActionTypes.GET_USER_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    yield put({ type: ReduxActionTypes.GET_USER_ERROR, payload: error });
  }
}

export default function* userSagas() {
  yield all([
    takeLatest(ReduxActionTypes.LOGIN, loginSaga),
    takeLatest(ReduxActionTypes.DEPOSIT, depositSaga),
    takeLatest(ReduxActionTypes.WITHDRAW, withdrawSaga),
    takeLatest(ReduxActionTypes.GET_USER, getUserSaga),
    takeLatest(ReduxActionTypes.REGISTER, registerSaga),
  ]);
}
