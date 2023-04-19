import get from 'lodash/get';
import set from 'lodash/set';
import noop from 'lodash/noop';

export class Options<T extends object> {
  private readonly defaultOptions: T;
  private currentOptions: T;
  private listeners: Record<string, Function> = { update: noop };

  constructor(defaultOptions: T) {
    this.defaultOptions = defaultOptions;
    this.currentOptions = { ...defaultOptions };
  }

  get(key: string, defaultValue?: any) {
    return get(this.currentOptions, key, defaultValue);
  }

  _set(key: string, value: any) {
    set(this.currentOptions, key, value);
  }

  set(key: string, value: any) {
    this._set(key, value);
    this.listeners['update'].call(this);
  }

  fetch() {
    return { ...this.currentOptions };
  }

  _assign(options: T) {
    this.currentOptions = { ...this.defaultOptions, ...this.currentOptions, ...options };
  }

  assign(options: T) {
    this._assign(options);
    this.listeners['update'].call(this);
    return this.fetch();
  }

  on(key: string, func: Function) {
    this.listeners[key] = func;
  }
}
