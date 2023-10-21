import mongoose from 'mongoose';
import mschema2Jsonschema from 'mongoose-schema-jsonschema';
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
import { ModelRouterOptions, DefaultModelRouterOptions, ExtendedModelRouterOptions } from '../interfaces';
import { getDefaultModelOption, getDefaultModelOptions } from './default-model-options';

mschema2Jsonschema(mongoose);
const pluralize = mongoose.pluralize();

type ExtendedModel = mongoose.Model<any> & { jsonSchema: Function };

const defaultModelOptions: ModelRouterOptions = {
  basePath: null,
  mandatoryFields: [],
};

const modelOptions: Record<string, OptionsManager<ModelRouterOptions, ExtendedModelRouterOptions>> = {};

const modelJsonSchemas: Record<string, any> = {};

const createModelOptions = (modelName: string) => {
  const model = mongoose.model(modelName) as ExtendedModel;

  // TODO: display warning that the model does not exist
  if (!model) return null;

  const manager = new OptionsManager<ModelRouterOptions, ExtendedModelRouterOptions>({
    ...defaultModelOptions,
    modelName,
  });

  manager
    .onchange('permissionSchema', function (newval, key, target, oldval) {
      const schemaKeys = Object.keys(newval);

      const globalPermissionKeys = {};
      const modelPermissionKeys = {};

      const stringHandler = (str) =>
        str
          .trim()
          .split(' ')
          .some((v) => v.startsWith(target.modelPermissionPrefix));

      const arrayHandler = (arr) =>
        arr.some((item) => {
          if (isString(item)) return stringHandler(item);
          else if (isArray(item)) return arrayHandler(item);
          else return true;
        });

      forEach(schemaKeys, (skey) => {
        forEach(newval[skey], (val, key) => {
          if (!isArray(globalPermissionKeys[key])) {
            globalPermissionKeys[key] = [];
          }

          if (!isArray(modelPermissionKeys[key])) {
            modelPermissionKeys[key] = [];
          }

          if (isBoolean(val)) {
            globalPermissionKeys[key].push(skey);
          } else {
            if (target.modelPermissionPrefix) {
              if (isString(val)) {
                const hasModelPermission = stringHandler(val);
                if (hasModelPermission) {
                  modelPermissionKeys[key].push(skey);
                } else {
                  globalPermissionKeys[key].push(skey);
                }
              } else if (isArray(val)) {
                const hasModelPermission = arrayHandler(val);
                if (hasModelPermission) {
                  modelPermissionKeys[key].push(skey);
                } else {
                  globalPermissionKeys[key].push(skey);
                }
              } else if (isFunction(val)) {
                modelPermissionKeys[key].push(skey);
              }
            } else {
              modelPermissionKeys[key].push(skey);
            }
          }
        });
      });

      target._permissionSchemaKeys = schemaKeys;
      target._globalPermissionKeys = globalPermissionKeys;
      target._modelPermissionKeys = modelPermissionKeys;
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

  modelJsonSchemas[modelName] = model.jsonSchema();
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

export const getModelNames = () => {
  return Object.keys(modelOptions);
};

export const getModelJsonSchema = (modelName: string) => {
  return modelJsonSchemas[modelName];
};
