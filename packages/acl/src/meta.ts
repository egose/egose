import mongoose from 'mongoose';
import get from 'lodash/get';
import keys from 'lodash/keys';
import forEach from 'lodash/forEach';
import { buildRefs, buildSubPaths } from './helpers';

let isReady = false;
const modelRefs = {};
const modelSubs = {};
const modelAtts = {};
const listeners = [];

export const checkIfReady = () => isReady;
export const listen = (fn) => listeners.push(fn);

let _interval = setInterval(() => {
  const modelNames = Object.keys(mongoose.models);
  modelNames.forEach((modelName) => {
    const schema = mongoose.models[modelName].schema;
    // @ts-ignore
    const references = buildRefs(schema.tree);
    // @ts-ignore
    const subPaths = buildSubPaths(schema.tree);
    modelRefs[modelName] = references;
    modelSubs[modelName] = subPaths;
    modelAtts[modelName] = keys(schema.obj);
  });

  if (modelNames.length > 0) {
    clearInterval(_interval);
    forEach(listeners, (listener) => {
      listener();
    });
    isReady = true;
  }
}, 10);

export const getModelRef = (modelName: string, refPath: string) => get(modelRefs, `${modelName}.${refPath}`, null);
export const getModelSub = (modelName: string) => get(modelSubs, modelName, []);
export const getModelAtt = (modelName: string) => get(modelAtts, modelName, []);
