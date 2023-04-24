import { Document, Schema } from 'mongoose';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';

export const isSchema = (val) => val instanceof Schema;
export const isObjectIdType = (val) => val === 'ObjectId' || val === Schema.Types.ObjectId;
export const isReference = (val) => isPlainObject(val) && val.ref && isObjectIdType(val.type);

export const isPromise = function isPromise(val) {
  return val && val.then && isFunction(val.then);
};

export const isDocument = function isDocument(doc) {
  return doc instanceof Document;
};

export const toAsyncFn = function toAsyncFn(fn: Function, defaultValue?: any) {
  if (!fn) return () => Promise.resolve(defaultValue);
  return function asyncFn(...args) {
    const ret = fn.apply(this, args);
    return isPromise(ret) ? ret : Promise.resolve(ret);
  };
};

export const mapValuesAsync = async function mapValuesAsync(object, asyncFn) {
  return Object.fromEntries(
    await Promise.all(Object.entries(object).map(async ([key, value]) => [key, await asyncFn(value, key, object)])),
  );
};

export const arrToObj = (arr: string[]): any => {
  const obj = {};
  for (let x = 0; x < arr.length; x++) {
    obj[arr[x]] = true;
  }
  return obj;
};

export const addLeadingSlash = (str) => (str.startsWith('/') ? str : `/${str}`);

export const removeConsecutiveSlashesFromUrl = (url) => url.replace(/\/{2,}/g, '/');

export const processUrl = (url) => addLeadingSlash(removeConsecutiveSlashesFromUrl(url));
