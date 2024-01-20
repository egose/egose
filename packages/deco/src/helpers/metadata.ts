import { iterate } from 'iterare';
import { isConstructor, isFunction } from '../../../_common/utils/types';
import {
  ROOT_ROUTER_WATERMARK,
  ROUTER_WATERMARK,
  DEFAULT_MODEL_ROUTER_OPTIONS_WATERMARK,
  MODEL_ROUTER_OPTIONS_WATERMARK,
  ROUTER_MODEL,
  ROUTER_OPTIONS,
  GLOBAL_PERMISSIONS_WATERMARK,
  DOC_PERMISSIONS_WATERMARK,
  ROUTE_GUARD_WATERMARK,
  BASE_FILTER_WATERMARK,
  VALIDATE_WATERMARK,
  PREPARE_WATERMARK,
  TRANSFORM_WATERMARK,
  DECORATE_WATERMARK,
  DECORATE_ALL_WATERMARK,
  IDENTIFIER_WATERMARK,
} from '../constants';

export const getMetadata = (obj: object, key: string) => {
  return Reflect.getMetadata(key, obj) || null;
};

export const getMetadataKeys = (obj: object) => {
  return Reflect.getMetadataKeys(obj);
};

export const getMetadataKeysStartWith = (obj: object, startKey: string) => {
  return Reflect.getMetadataKeys(obj).filter((key: string) => key.startsWith(startKey));
};

export const getMethodDescriptor = (obj: object, method: string) => {
  do {
    const descriptor = Reflect.getOwnPropertyDescriptor(obj, method);
    if (!descriptor) {
      continue;
    }
    return descriptor;
  } while ((obj = Reflect.getPrototypeOf(obj)) && obj !== Object.prototype && obj);

  return undefined;
};

export const getMethodMetadata = (obj: object, method: string, key: string) => {
  const descriptor = getMethodDescriptor(obj, method);
  return getMetadata(descriptor.value, key);
};

export const getMethodMetadataKeys = (obj: object, method: string) => {
  const descriptor = getMethodDescriptor(obj, method);
  return getMetadataKeys(descriptor.value);
};

export const getMethodMetadataKeysStartWith = (obj: object, method: string, startKey: string) => {
  const descriptor = getMethodDescriptor(obj, method);
  return getMetadataKeysStartWith(descriptor.value, startKey);
};

export function* getAllMethodNames(obj: object): IterableIterator<string> {
  const isMethod = (prop: string) => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    if (descriptor.set || descriptor.get) {
      return false;
    }
    return !isConstructor(prop) && isFunction(obj[prop]);
  };
  do {
    yield* iterate(Object.getOwnPropertyNames(obj)).filter(isMethod).toArray();
  } while ((obj = Reflect.getPrototypeOf(obj)) && obj !== Object.prototype);
}

export const isRootRouter = (obj: object) => {
  return !!getMetadata(obj, ROOT_ROUTER_WATERMARK);
};

export const isModelRouter = (obj: object) => {
  return !!getMetadata(obj, ROUTER_WATERMARK);
};

export const isDefaultModelRouterOptions = (obj: object) => {
  return !!getMetadata(obj, DEFAULT_MODEL_ROUTER_OPTIONS_WATERMARK);
};

export const isModelRouterOptions = (obj: object) => {
  return !!getMetadata(obj, MODEL_ROUTER_OPTIONS_WATERMARK);
};

export const isGlobalPermissionsMethod = (obj: object, method: string) => {
  return !!getMethodMetadata(obj, method, GLOBAL_PERMISSIONS_WATERMARK);
};

export const isDocPermissionsMethod = (obj: object, method: string) => {
  return !!getMethodMetadata(obj, method, DOC_PERMISSIONS_WATERMARK);
};

export const isBaseFilterMethod = (obj: object, method: string) => {
  return !!getMethodMetadata(obj, method, BASE_FILTER_WATERMARK);
};

export const isValidateMethod = (obj: object, method: string) => {
  return !!getMethodMetadata(obj, method, VALIDATE_WATERMARK);
};

export const isPrepareMethod = (obj: object, method: string) => {
  return !!getMethodMetadata(obj, method, PREPARE_WATERMARK);
};

export const isTransformMethod = (obj: object, method: string) => {
  return !!getMethodMetadata(obj, method, TRANSFORM_WATERMARK);
};

export const isDecorateMethod = (obj: object, method: string) => {
  return !!getMethodMetadata(obj, method, DECORATE_WATERMARK);
};

export const isDecorateAllMethod = (obj: object, method: string) => {
  return !!getMethodMetadata(obj, method, DECORATE_ALL_WATERMARK);
};

export const isRouteGuardMethod = (obj: object, method: string) => {
  return !!getMethodMetadata(obj, method, ROUTE_GUARD_WATERMARK);
};

export const isIdentifierMethod = (obj: object, method: string) => {
  return !!getMethodMetadata(obj, method, IDENTIFIER_WATERMARK);
};
