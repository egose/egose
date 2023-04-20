import get from 'lodash/get';
import set from 'lodash/set';
import assign from 'lodash/assign';

export class OptionsManager<T extends object> {
  private readonly defaultOptions: T;
  private currentOptions: T;
  private listeners: Record<string, Function> = {};

  constructor(defaultOptions: T) {
    this.defaultOptions = defaultOptions;
    const _this = this;

    this.currentOptions = new Proxy({} as T, {
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

  get(key: string, defaultValue?: any) {
    return get(this.currentOptions, key, defaultValue);
  }

  set(key: string, value: any) {
    set(this.currentOptions, key, value);
  }

  fetch() {
    return { ...this.currentOptions };
  }

  assign(options: T) {
    assign(this.currentOptions, options);
  }

  onchange(key: string, func: Function) {
    this.listeners[key] = func;
    return this;
  }
}
