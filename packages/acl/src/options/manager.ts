import get from 'lodash/get';
import set from 'lodash/set';
import assign from 'lodash/assign';

export class OptionsManager<T1 extends object, T2 extends object> {
  private readonly defaultOptions: T1;
  private currentOptions: T1;
  private listeners: { [key in keyof T1]?: Function };

  constructor(defaultOptions: T1) {
    this.defaultOptions = defaultOptions;
    this.listeners = {};
    const _this = this;

    this.currentOptions = new Proxy({} as T1, {
      set(target, key, value) {
        const keystr = String(key);
        const oldvalue = target[key];
        target[key] = value;
        _this.listeners[keystr] && _this.listeners[keystr].call(_this, value, keystr, target, oldvalue);
        return true;
      },
    });
  }

  build() {
    this.assign(this.defaultOptions);
    return this;
  }

  get<K extends keyof T2>(key: K, defaultValue?: T2[K]) {
    return get(this.currentOptions, key, defaultValue);
  }

  set<K extends keyof T2>(key: K, value: T2[K]) {
    set(this.currentOptions, key, value);
  }

  fetch() {
    return { ...this.currentOptions };
  }

  assign(options: T1) {
    assign(this.currentOptions, options);
  }

  onchange<K extends keyof T1>(key: K, func: Function) {
    set(this.listeners, key, func);
    return this;
  }
}
