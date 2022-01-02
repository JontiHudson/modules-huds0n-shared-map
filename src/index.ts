import { useMemo } from 'react';

import Error from '@huds0n/error';
import { toArray } from '@huds0n/shared-state/src/helpers';
import { SharedState } from '@huds0n/shared-state';

import * as Types from './types';

export namespace SharedMap {
  export type Key = string;
  export type Id = string | number;

  export type Element<K extends Key> = Types.Element<K>;
  export type State<K extends Key, E extends Element<K>> = Types.State<K, E>;

  export type Options<K extends Key, E extends Element<K>> = Types.Options<
    K,
    E
  >;
}

export class SharedMap<
  K extends SharedMap.Key,
  E extends SharedMap.Element<K>,
> extends SharedState<SharedMap.State<K, E>> {
  private _UpdateState: Types.UpdateSharedState;
  readonly key: SharedMap.Key;

  private static elementsToState<
    K extends SharedMap.Key,
    E extends SharedMap.Element<K>,
  >(key: K, elements: E | E[]): SharedMap.State<K, E> {
    const elementsArray = toArray(elements);

    return elementsArray.reduce(
      (acc, element) => ({ ...acc, [element[key]]: element }),
      {},
    );
  }

  constructor(key: K, options: SharedMap.Options<K, E> = {}) {
    const { debugLabel, defaultData = [] } = options;

    super(SharedMap.elementsToState(key, defaultData), { debugLabel });

    this.key = key;
    this._UpdateState = new SharedState<Types.UpdateState>({
      updateId: Symbol('Initial updater'),
    });

    this.add = this.add.bind(this);
    this.refresh = this.refresh.bind(this);
    this.registerList = this.registerList.bind(this);
    this.remove = this.remove.bind(this);
    this.unregisterList = this.unregisterList.bind(this);
    this.useElement = this.useElement.bind(this);
    this.useElement = this.useElement.bind(this);
    this.useList = this.useList.bind(this);
    this.useMemo = this.useMemo.bind(this);
  }

  private setMap(elements: E | E[]) {
    return super.setState(SharedMap.elementsToState(this.key, elements));
  }

  private updateUpdateState() {
    this._UpdateState.setState({ updateId: Symbol('Updater') });
  }

  get(id: SharedMap.Id): E | undefined {
    return this.state[id];
  }

  get data() {
    return Object.values(this.state);
  }

  add(newElements: E | E[], callback?: () => any) {
    try {
      const updatedState = this.setMap(newElements);

      if (updatedState) {
        this.updateUpdateState();

        this.debugger({ send: updatedState });
      }
    } catch (error) {
      throw Error.transform(error, {
        name: 'State Error',
        code: 'ADD_DATA_ERROR',
        message: 'Error adding data',
        severity: 'HIGH',
      });
    }

    if (callback) callback();
  }

  remove(removeElements: E[K] | E[K][], callback?: () => any) {
    try {
      const elementsArray = toArray(removeElements);

      const removeState = elementsArray.reduce(
        (acc, element) => ({ ...acc, [element[this.key]]: undefined }),
        {},
      );

      const removedState = super.setState(removeState);

      if (removedState) {
        this.updateUpdateState();

        super.debugger({ removeElements: removedState });
      }
    } catch (error) {
      throw Error.transform(error, {
        name: 'State Error',
        code: 'REMOVE_DATA_ERROR',
        message: 'Error removing data',
        severity: 'HIGH',
      });
    }

    // optional callback once complete
    if (callback) callback();
  }

  refresh(id?: SharedMap.Id | SharedMap.Id[]) {
    try {
      super.refresh(id);
      this._UpdateState.refresh();
    } catch (error) {
      throw Error.transform(error, {
        name: 'State Error',
        code: 'REFRESH_MAP_ERROR',
        message: 'Refresh map error',
        severity: 'HIGH',
      });
    }
  }

  reset(resetData?: SharedMap.State<K, E>) {
    try {
      super.reset(resetData);
      this.updateUpdateState();
    } catch (error) {
      throw Error.transform(error, {
        name: 'State Error',
        code: 'RESET_MAP_ERROR',
        message: 'Reset map error',
        severity: 'HIGH',
      });
    }
  }

  registerList(component: React.Component) {
    this._UpdateState.register(component, 'updateId');
  }

  unregisterList(component: React.Component) {
    this._UpdateState.unregister(component);
  }

  useElement(id: SharedMap.Id) {
    return this.useProp(id);
  }

  useList() {
    const [{ updateId }] = this._UpdateState.useState('updateId');

    return { updateId, data: this.data };
  }

  useMemo<T>(memoFunction: (array?: E[]) => T) {
    const { updateId, data } = this.useList();

    return useMemo(() => memoFunction(data), [updateId]);
  }
}
