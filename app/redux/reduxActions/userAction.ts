import { ReduxActionTypes } from "../reduxActionConstants";
export const loginAction = (email: string, password: string) => ({
  type: ReduxActionTypes.LOGIN,
  payload: { email, password },
});
export const loginSuccess = (user: any) => ({
  type: ReduxActionTypes.LOGIN_SUCCESS,
  payload: user,
});
export const registerAction = (
  email: string,
  name: string,
  password: string,
  numberPlate: string
) => ({
  type: ReduxActionTypes.REGISTER,
  payload: { email, name, password, numberPlate },
});
export const depositAction = (userId: string, amount: number) => ({
  type: ReduxActionTypes.DEPOSIT,
  payload: { userId, amount },
});
export const withdrawAction = (userId: string, amount: number) => ({
  type: ReduxActionTypes.WITHDRAW,
  payload: { userId, amount },
});
export const getUserAction = () => ({
  type: ReduxActionTypes.GET_USER,
});
export const logoutAction = () => ({
  type: ReduxActionTypes.LOGOUT,
});
