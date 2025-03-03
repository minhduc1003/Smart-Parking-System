import cartSagas from "./userSagas";
import { all, call, spawn } from "redux-saga/effects";

export const sagas = [cartSagas];

export function* rootSaga(sagasToRun = sagas) {
  yield all(
    sagasToRun.map((saga) =>
      spawn(function* () {
        while (true) {
          try {
            yield call(saga);
            break;
          } catch (e) {
            console.log(e);
          }
        }
      })
    )
  );
}
