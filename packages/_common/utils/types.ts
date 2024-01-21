import { Document, Schema } from 'mongoose';

export const isFunction = (val: any): boolean => typeof val === 'function';
export const isString = (val: any): val is string => typeof val === 'string';
export const isNumber = (val: any): val is number => typeof val === 'number';
export const isConstructor = (val: any): boolean => val === 'constructor';
export const isEmpty = (array: any): boolean => !(array && array.length > 0);
export const isSymbol = (val: any): val is symbol => typeof val === 'symbol';
export const isObject = (val: any) => val !== null && typeof val === 'object';
export const isPlainObject = (val: any) => {
  if (val === null || typeof val !== 'object' || val.constructor !== Object) {
    return false;
  }

  const proto = Object.getPrototypeOf(val);
  return proto === null || proto === Object.prototype;
};
export const isSchema = (val) => val instanceof Schema;
export const isObjectIdType = (val) => val === 'ObjectId' || val === Schema.Types.ObjectId;
export const isReference = (val, ref?: string) =>
  (isPlainObject(val) && isObjectIdType(val.type) && !val.ref) || val.ref === ref;
