import 'reflect-metadata';
import {
  GLOBAL_PERMISSIONS_WATERMARK,
  DOC_PERMISSIONS_WATERMARK,
  ROUTE_GUARD_WATERMARK,
  BASE_FILTER_WATERMARK,
  VALIDATE_WATERMARK,
  PREPARE_WATERMARK,
  TRANSFORM_WATERMARK,
  DECORATE_WATERMARK,
  DECORATE_ALL_WATERMARK,
} from '../constants';

const setMethodMetadata = (watermark: string, parentOptionKey: string, optionKey: string) => {
  return (target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    Reflect.defineMetadata(watermark, true, descriptor.value);
    Reflect.defineMetadata(`${parentOptionKey}.${optionKey}`, true, descriptor.value);
    return descriptor;
  };
};

export function GlobalPermissions(): MethodDecorator {
  return setMethodMetadata(GLOBAL_PERMISSIONS_WATERMARK, 'globalPermissions', '');
}

export function DocPermissions(optionKey: 'default' | 'create' | 'update' | 'list' | 'read'): MethodDecorator {
  return setMethodMetadata(DOC_PERMISSIONS_WATERMARK, 'docPermissions', optionKey);
}

export function BaseQuery(optionKey: 'default' | 'update' | 'list' | 'read' | 'delete'): MethodDecorator {
  return setMethodMetadata(BASE_FILTER_WATERMARK, 'baseFilter', optionKey);
}

export function Validate(optionKey: 'default' | 'create' | 'update'): MethodDecorator {
  return setMethodMetadata(VALIDATE_WATERMARK, 'validate', optionKey);
}

export function Prepare(optionKey: 'default' | 'create' | 'update'): MethodDecorator {
  return setMethodMetadata(PREPARE_WATERMARK, 'prepare', optionKey);
}

export function Transform(optionKey: 'default' | 'update'): MethodDecorator {
  return setMethodMetadata(TRANSFORM_WATERMARK, 'transform', optionKey);
}

export function Decorate(optionKey: 'default' | 'create' | 'update' | 'list' | 'read'): MethodDecorator {
  return setMethodMetadata(DECORATE_WATERMARK, 'decorate', optionKey);
}

export function DecorateAll(optionKey: 'default' | 'list'): MethodDecorator {
  return setMethodMetadata(DECORATE_ALL_WATERMARK, 'decorateAll', optionKey);
}

export function RouteGuard(optionKey: 'default' | 'create' | 'update' | 'list' | 'read' | 'delete'): MethodDecorator {
  return setMethodMetadata(ROUTE_GUARD_WATERMARK, 'routeGuard', optionKey);
}
