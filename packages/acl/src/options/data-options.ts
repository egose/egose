import mongoose from 'mongoose';
import get from 'lodash/get';
import set from 'lodash/set';
import isNil from 'lodash/isNil';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import forEach from 'lodash/forEach';
import { addLeadingSlash } from '../lib';
import { OptionsManager } from './manager';
import { DataRouterOptions } from '../interfaces';

const pluralize = mongoose.pluralize();

const dataOptions: Record<string, OptionsManager<DataRouterOptions, DataRouterOptions>> = {};

const defaultDataOptions: DataRouterOptions = {
  basePath: null,
  queryPath: '__query',
};

const createDataOptions = (dataName: string) => {
  const manager = new OptionsManager<DataRouterOptions, DataRouterOptions>({
    ...defaultDataOptions,
    dataName,
  });

  manager
    .onchange('basePath', function (newval, key, target, oldval) {
      let basePath = '';
      if (isNil(newval)) {
        basePath = `/${pluralize(dataName)}`;
      } else if (isString(newval)) {
        basePath = addLeadingSlash(basePath);
      }

      target[key] = basePath;
    })
    .build();

  return manager;
};

const getOrCreateDataOptions = (dataName: string) => {
  let manager = dataOptions[dataName];
  if (!manager) {
    manager = createDataOptions(dataName);
    dataOptions[dataName] = manager;
  }

  return manager;
};

export const setDataOptions = (dataName: string, options: DataRouterOptions) => {
  const manager = getOrCreateDataOptions(dataName);
  const dataOptions = manager.fetch();

  manager.assign({ ...dataOptions, ...options });
};

export const setDataOption = <K extends keyof DataRouterOptions>(
  dataName: string,
  key: K,
  value: DataRouterOptions[K],
) => {
  const manager = getOrCreateDataOptions(dataName);

  manager.set(key, value);
};

export const getDataOptions = (dataName: string) => {
  const manager = getOrCreateDataOptions(dataName);
  return manager.fetch();
};

export const getDataOption = <K extends keyof DataRouterOptions>(
  dataName: string,
  key: K | string,
  defaultValue?: DataRouterOptions[K],
) => {
  const manager = getOrCreateDataOptions(dataName);

  const keys = key.split('.');
  if (keys.length === 1) return manager.get(key, defaultValue);

  let option = manager.get(key, undefined);
  if (option) return option;

  const parentKey = keys.slice(0, -1).join('.') as keyof DataRouterOptions;
  option = manager.get(`${parentKey}.default`);

  if (option === undefined) option = manager.get(parentKey, defaultValue);
  return option;
};

export const getDataNames = () => {
  return Object.keys(dataOptions);
};
