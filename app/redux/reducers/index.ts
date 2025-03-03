import { combineReducers } from "redux";
import userReducer, { UserReduxState } from "./user/userReducers";

export interface AppState {
  user: UserReduxState;
}

export const reducerObject = {
  user: userReducer,
};

export const appReducer = combineReducers(reducerObject);
