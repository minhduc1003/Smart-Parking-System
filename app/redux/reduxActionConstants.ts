"use client";

export const ReduxActionTypes = {
  LOGIN: "LOGIN",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_ERROR: "LOGIN_ERROR",
  LOGOUT: "LOGOUT",
  REGISTER: "REGISTER",
  REGISTER_SUCCESS: "REGISTER_SUCCESS",
  REGISTER_ERROR: "REGISTER_ERROR",
  DEPOSIT: "DEPOSIT",
  WITHDRAW: "WITHDRAW",
  DEPOSIT_SUCCESS: "DEPOSIT_SUCCESS",
  WITHDRAW_SUCCESS: "WITHDRAW_SUCCESS",
  DEPOSIT_ERROR: "DEPOSIT_ERROR",
  WITHDRAW_ERROR: "WITHDRAW_ERROR",
  GET_USER: "GET_USER",
  GET_USER_SUCCESS: "GET_USER_SUCCESS",
  GET_USER_ERROR: "GET_USER_ERROR",
};

export const ReduxActionErrorTypes = {};

export type ReduxActionType =
  (typeof ReduxActionTypes)[keyof typeof ReduxActionTypes];
export type ReduxActionErrorType =
  (typeof ReduxActionErrorTypes)[keyof typeof ReduxActionErrorTypes];

export interface ReduxAction<T> {
  type: ReduxActionType | ReduxActionErrorType;
  payload: T;
}

export type ReduxActionWithoutPayload = Pick<ReduxAction<undefined>, "type">;

export interface EvaluationReduxAction<T> extends ReduxAction<T> {
  postEvalActions?: Array<ReduxAction<any> | ReduxActionWithoutPayload>;
}

export interface ReduxActionWithCallbacks<T, S, E> extends ReduxAction<T> {
  onSuccess?: ReduxAction<S>;
  onError?: ReduxAction<E>;
  onSuccessCallback?: (response: S) => void;
  onErrorCallback?: (error: E) => void;
}

export interface PromisePayload {
  reject: any;
  resolve: any;
}

export interface ReduxActionWithPromise<T> extends ReduxAction<T> {
  payload: T & PromisePayload;
}
