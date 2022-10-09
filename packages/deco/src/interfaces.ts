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
  /**
   * list of routes.
   */
  routers: Type<any>[];
  options?: GlobalOptions & { baseUrl?: string };
}
