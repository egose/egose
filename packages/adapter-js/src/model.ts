import cloneDeep from 'lodash.clonedeep';
import assign from 'lodash.assign';
import omit from 'lodash.omit';
import pick from 'lodash.pick';
import { AxiosRequestConfig } from 'axios';
import { Document } from './types';
import { ModelService } from './services';

export class Model<T extends Document, TData extends Partial<T> = T> {
  private _data!: TData;
  private readonly _service!: ModelService<T>;
  private modifiedPaths!: Set<string>;

  constructor(data: TData, adapter: ModelService<T>) {
    this.defineHiddenDataProp(cloneDeep(data));
    this.defineHiddenAdapterProp(adapter);
    this.definePublicDataProps();
    this.modifiedPaths = new Set();
  }

  static create<T, TData extends Partial<T> = T>(data: TData, adapter: ModelService<T>) {
    return new Model<T, TData>(data, adapter) as Model<T, TData> & TData;
  }

  async save(reqConfig?: AxiosRequestConfig) {
    let result;
    if (this._data._id) {
      result = await this._service.update(this._data._id, this.prepareDate(), { returningAll: false }, reqConfig);
    } else {
      result = await this._service.create(this.prepareDate(), null, reqConfig);
    }

    if (result.success) {
      this.updateModel(result.raw);
    }

    this.modifiedPaths.clear();

    return {
      success: result.success,
      message: result.message,
      data: Model.create<T, TData>(this._data, this._service),
    };
  }

  // async validate() {}

  private updateModel(data) {
    assign(this._data, data);
    this.definePublicDataProps();
  }

  private prepareDate() {
    return omit(pick(this._data, Array.from(this.modifiedPaths).map(String)), ['_id']);
  }

  private defineHiddenDataProp(initialValue) {
    const _this = this;
    Object.defineProperty(_this, '_data', {
      value: new Proxy(initialValue, {
        set(target, key, value) {
          const keystr = String(key);
          if (!_this.modifiedPaths.has(keystr)) _this.modifiedPaths.add(keystr);
          target[key] = value;
          return true;
        },
      }),
      enumerable: false,
      writable: true,
      configurable: false,
    });
  }

  private defineHiddenAdapterProp(initialValue) {
    Object.defineProperty(this, '_service', {
      value: initialValue,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  private definePublicDataProps() {
    const keys = Object.keys(this._data);
    const keycnt = keys.length;

    for (let x = 0; x < keycnt; x++) {
      const key = keys[x];
      if (this.hasOwnProperty(key)) continue;

      Object.defineProperty(this, key, {
        enumerable: true,
        get: () => (this._data.hasOwnProperty(key) ? this._data[key] : null),
        set: (value) => (this._data[key] = value),
      });
    }
  }
}
