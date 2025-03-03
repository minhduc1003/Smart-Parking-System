import { ReduxActionTypes } from "@/redux/reduxActionConstants";
import { createImmerReducer } from "@/utils/reducerUtils";

const initialState: UserReduxState = {
  user: undefined,
};

const userReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.LOGIN_SUCCESS]: (state: any, action: any) => {
    state.user = action.payload;
  },
  [ReduxActionTypes.LOGOUT]: (state: any) => {
    state.user = undefined;
  },
});

export interface UserReduxState {
  user?: {
    id: string;
    name: string;
    email: string;
    numberPlate: string;
    role: string;
  };
}
export default userReducer;
