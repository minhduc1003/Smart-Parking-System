import { ReduxActionTypes } from "../reduxActionConstants";
export const loginAction = (email: string, password: string) => ({
  type: ReduxActionTypes.LOGIN,
  payload: { email, password },
});
export const loginSuccess = (user: any) => ({
  type: ReduxActionTypes.LOGIN_SUCCESS,
  payload: user,
});
