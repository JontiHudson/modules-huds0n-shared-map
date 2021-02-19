import { SharedState } from '@huds0n/shared-state';
import { StateStore } from '@huds0n/shared-state/src/types';

export type Key = string;
export type Id = string | number;

export type Element<K extends Key> = Record<K, Id> &
  Omit<Record<string, any>, K>;

export type State<K extends Key, E extends Element<K>> = Record<Id, E>;

export type UpdateState = { updateId: Symbol };
export type UpdateSharedState = SharedState<UpdateState>;

export type Options<K extends Key, E extends Element<K>> = {
  debugLabel?: string;
  defaultData?: E[];
};

export type MapStore<K extends Key, E extends Element<K>> = StateStore<
  State<K, E>
>;
