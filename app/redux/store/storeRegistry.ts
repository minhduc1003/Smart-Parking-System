"use client";

import { Store } from "redux";
import { AnyAction } from "redux-saga";

export default class StoreRegistry {
  private static _store: Store;
  static getStore(): Store {
    return this._store;
  }
  static registerStore(store: Store<any, AnyAction>) {
    this._store = store;
  }
}
