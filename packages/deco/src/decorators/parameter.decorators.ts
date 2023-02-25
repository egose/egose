import 'reflect-metadata';
import { ARGS_METADATA, HookParamtypes } from '../constants';

const mergeHookParams = (target, key, index, type) => {
  const args = Reflect.getMetadata(ARGS_METADATA, target.constructor, key) || [];
  Reflect.defineMetadata(ARGS_METADATA, args.concat({ index, type }), target.constructor, key);
};

export function Request(): ParameterDecorator {
  return (target, key, index) => mergeHookParams(target, key, index, HookParamtypes.REQUEST);
}

export function Document(): ParameterDecorator {
  return (target, key, index) => mergeHookParams(target, key, index, HookParamtypes.DOCUMENT);
}

export function Permissions(): ParameterDecorator {
  return (target, key, index) => mergeHookParams(target, key, index, HookParamtypes.PERMISSIONS);
}

export function Context(): ParameterDecorator {
  return (target, key, index) => mergeHookParams(target, key, index, HookParamtypes.CONTEXT);
}

// TODO HERE
export function ID(): ParameterDecorator {
  return (target, key, index) => mergeHookParams(target, key, index, HookParamtypes.CONTEXT);
}
