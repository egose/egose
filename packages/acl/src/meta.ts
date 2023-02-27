import mongoose from 'mongoose';
import get from 'lodash/get';
import forEach from 'lodash/forEach';
import { buildRefs, buildSubPaths } from './helpers';

let isReady = false;
const modelRefs = {};
const modelSubs = {};
const listeners = [];

export const checkIfReady = () => isReady;
export const listen = (fn) => listeners.push(fn);

let _interval = setInterval(() => {
  const modelNames = Object.keys(mongoose.models);
  modelNames.forEach((modelName) => {
    // @ts-ignore
    const references = buildRefs(mongoose.models[modelName].schema.tree);
    // @ts-ignore
    const subPaths = buildSubPaths(mongoose.models[modelName].schema.tree);
    modelRefs[modelName] = references;
    modelSubs[modelName] = subPaths;
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
