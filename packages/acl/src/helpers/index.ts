// @ts-nocheck
export * from './collection';
export * from './document';
export * from './errors';
export * from './query';
export * from './string';

import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import noop from 'lodash/noop';
import { isSchema, isReference, mapValuesAsync } from '../lib';
import { FilterOperator } from '../enums';

function recurseObject(obj: any) {
  if (isSchema(obj)) {
    return buildRefs(obj.tree);
  }

  if (!isObject(obj)) return null;
  if (isReference(obj)) {
    return obj.ref;
  }

  let ret = null;
  forEach(obj, (val, key) => {
    ret = recurseObject(val);
    if (!isEmpty(ret)) {
      return false;
    }
  });

  return ret;
}

export function buildRefs(schema: any) {
  const references = {};
  const subPaths = [];

  forEach(schema, (val, key) => {
    const paths = recurseObject(val);
    if (!isEmpty(paths)) {
      references[key] = paths;
    }

    // collection subdocuments paths
    // see https://mongoosejs.com/docs/subdocs.html#subdocuments
    const target = val.type || val;
    if (isArray(target) && target.length > 0) {
      if (isSchema(target[0]) || isPlainObject(target[0])) {
        subPaths.push(key);
      }
    }
  });

  return references;
}

export function buildSubPaths(schema: any): string[] {
  const subPaths = [];

  forEach(schema, (val, key) => {
    // collection subdocuments paths
    // see https://mongoosejs.com/docs/subdocs.html#subdocuments
    const target = val.type || val;
    if (isArray(target) && target.length > 0) {
      if (isSchema(target[0]) || (isPlainObject(target[0]) && !isReference(target[0]))) {
        subPaths.push(key);
      }
    }
  });

  return subPaths;
}

export async function iterateQuery(query: any, handler: Function) {
  if (!isPlainObject(query)) return query;
  if (!handler) return noop;

  return mapValuesAsync(query, async (val, key) => {
    if (isPlainObject(val)) {
      if (val.$$sq) {
        return handler(FilterOperator.SubQuery, val.$$sq, key);
      } else if (val.$$date) {
        return handler(FilterOperator.Date, val.$$sq, key);
      } else {
        return iterateQuery(val, handler);
      }
    }

    if (isArray(val)) {
      return Promise.all(val.map((v) => iterateQuery(v, handler)));
    }

    return val;
  });
}

export const createValidator = (fn: (key: string) => boolean) => {
  const stringHandler = (key: string) =>
    key
      .trim()
      .split(' ')
      .every((v) => fn(v));

  const arrayHandler = (arr: string[] | string[][]) =>
    arr.some((item) => {
      if (isString(item)) return stringHandler(item);
      else if (isArray(item)) return arrayHandler(item);
      else return false;
    });

  return { stringHandler, arrayHandler };
};
