import mongoose from 'mongoose';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import { addLeadingSlash } from '../lib';
import { OptionsManager } from './manager';
import { ModelRouterOptions, DefaultModelRouterOptions, ExtendedModelRouterOptions } from '../interfaces';
import { getDefaultModelOption, getDefaultModelOptions } from './default-model-options';

const pluralize = mongoose.pluralize();

const defaultModelOptions: ModelRouterOptions = {
  basePath: null,
  mandatoryFields: [],
};

const modelOptions: Record<string, OptionsManager<ModelRouterOptions, ExtendedModelRouterOptions>> = {};

const createModelOptions = (modelName: string) => {
  const manager = new OptionsManager<ModelRouterOptions, ExtendedModelRouterOptions>({
    ...defaultModelOptions,
    modelName,
  });

  manager
    .onchange('permissionSchema', function (newval, key, target, oldval) {
      target.permissionSchemaKeys = Object.keys(newval);
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
};

export const setModelOption = <K extends keyof ExtendedModelRouterOptions>(
  modelName: string,
  key: K,
  value: ExtendedModelRouterOptions[K],
) => {
  const manager = getOrCreateModelOptions(modelName);

  manager.set(key, value);
};

export const getModelOptions = (modelName: string) => {
  const manager = getOrCreateModelOptions(modelName);
  return manager.fetch();
};

export const getModelOption = <K extends keyof ExtendedModelRouterOptions>(
  modelName: string,
  key: K,
  defaultValue?: ExtendedModelRouterOptions[K],
) => {
  const manager = getOrCreateModelOptions(modelName);
  const defaultModelValue = getDefaultModelOption(key as keyof DefaultModelRouterOptions, defaultValue);

  const keys = key.split('.');
  if (keys.length === 1) return manager.get(key, defaultModelValue);

  let option = manager.get(key, undefined);
  if (option) return option;

  const parentKey = keys.slice(0, -1).join('.') as keyof ModelRouterOptions;
  option = manager.get(`${parentKey}.default` as any);

  if (option === undefined) option = manager.get(parentKey, defaultModelValue);
  return option;
};
