import { ReduxActionTypes } from "@/redux/reduxActionConstants";
import { createImmerReducer } from "@/utils/reducerUtils";

const initialState: UserReduxState = {
  user: undefined,
};

const userReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.LOGIN_SUCCESS]: (state: any, action: any) => {
    state.user = action.payload;
  },
  [ReduxActionTypes.REGISTER_SUCCESS]: (state: any, action: any) => {
    state.user = action.payload;
  },
  [ReduxActionTypes.LOGOUT]: (state: any) => {
    state.user = undefined;
  },
  [ReduxActionTypes.DEPOSIT_SUCCESS]: (state: any, action: any) => {
    state.user = action.payload;
  },
  [ReduxActionTypes.WITHDRAW_SUCCESS]: (state: any, action: any) => {
    state.user = action.payload;
  },
  [ReduxActionTypes.GET_USER_SUCCESS]: (state: any, action: any) => {
    state.user = action.payload;
  },
});

export interface UserReduxState {
  user?: {
    _id: string;
    name: string;
    email: string;
    numberPlate: string;
    role: string;
    money: number;
  };
}
export default userReducer;
