import mongoose from 'mongoose';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import { addLeadingSlash } from '../lib';
import { OptionsManager } from './manager';
import { ModelRouterOptions } from '../interfaces';
import { getDefaultModelOption, getDefaultModelOptions } from './default-model-options';

const pluralize = mongoose.pluralize();

const defaultModelOptions: ModelRouterOptions = {
  basePath: null,
  mandatoryFields: [],
};

const modelOptions: Record<string, OptionsManager<ModelRouterOptions>> = {};

const createModelOptions = (modelName: string) => {
  const manager = new OptionsManager<ModelRouterOptions>({ ...defaultModelOptions, modelName });

  // TODO: explore way to listen on a specific property
  manager
    .onchange('permissionSchema', function (newval, key, target, oldval) {
      target['permissionSchemaKeys'] = Object.keys(newval);
    })
    .onchange('basePath', function (newval, key, target, oldval) {
      let basePath = '';
      if (isNil(newval)) {
        basePath = `/${pluralize(modelName)}`;
      } else if (isString(newval)) {
        basePath = addLeadingSlash(basePath);
      }

      target[key] = basePath;
    })
    .build();

  return manager;
};

const getOrCreateModelOptions = (modelName: string) => {
  let manager = modelOptions[modelName];
  if (!manager) {
    manager = createModelOptions(modelName);
    modelOptions[modelName] = manager;
  }

  return manager;
};

export const setModelOptions = (modelName: string, options: ModelRouterOptions) => {
  const manager = getOrCreateModelOptions(modelName);
  const modelOptions = manager.fetch();
  const defaultOptions = getDefaultModelOptions();

  manager.assign({ ...modelOptions, ...defaultOptions, ...options });
  return manager.fetch();
};

export const setModelOption = (modelName: string, key: string, value: any) => {
  const manager = getOrCreateModelOptions(modelName);

  manager.set(key, value);
  return manager.fetch();
};

export const getModelOptions = (modelName: string) => {
  const manager = getOrCreateModelOptions(modelName);
  return manager.fetch();
};

export const getModelOption = (modelName: string, key: string, defaultValue?: any) => {
  const manager = getOrCreateModelOptions(modelName);
  const defaultModelValue = getDefaultModelOption(key, defaultValue);

  const keys = key.split('.');
  if (keys.length === 1) return manager.get(key, defaultModelValue);

  let option = manager.get(key, undefined);
  if (option) return option;

  const parentKey = keys.slice(0, -1).join('.');
  option = manager.get(`${parentKey}.default`);

  if (option === undefined) option = manager.get(parentKey, defaultModelValue);
  return option;
};
