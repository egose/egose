import { GlobalOptions } from '@egose/acl';

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

/**
 * Interface defining the property object that describes the module.
 *
 * @see [Modules](https://docs.nestjs.com/modules)
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
