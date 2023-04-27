import { GlobalOptions } from '@egose/acl';

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

/**
 * Interface defining the property object that describes the module.
 *
 * @publicApi
 */
export interface ModuleMetadata {
  routers: Type<any>[];
  routerOptions?: Type<any>[];
  options?: GlobalOptions & { basePath?: string; handleErrors?: boolean };
}
