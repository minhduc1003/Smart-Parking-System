import createSagaMiddleware from "redux-saga";
import { appReducer } from "../reducers";
import { rootSaga } from "../sagas";
import StoreRegistry from "./storeRegistry";
import { configureStore } from "@reduxjs/toolkit";
import {
  TypedUseSelectorHook,
  useSelector as useReduxSelector,
} from "react-redux";
type AppState = ReturnType<typeof store.getState>;
const sagaMiddleware = createSagaMiddleware();
const store = configureStore({
  reducer: appReducer,
  middleware: (gDM: any) =>
    gDM({
      serializableCheck: false,
    }).concat(sagaMiddleware),
});
sagaMiddleware.run(rootSaga);
StoreRegistry.registerStore(store);

export const reduxStore = store;
export const useSelector: TypedUseSelectorHook<AppState> = useReduxSelector;
