import 'reflect-metadata';
import { isString } from 'lodash';
import { RootRouterProps, ModelRouterProps } from '@egose/acl';
import { ModuleMetadata } from '../interfaces';
import { ROOT_ROUTER_WATERMARK, ROUTER_WATERMARK, ROUTER_MODEL, ROUTER_OPTIONS } from '../constants';

/**
 * Decorator that marks a class as a [module](https://docs.nestjs.com/modules).
 *
 * Modules are used by Nest to organize the application structure into scopes. Controllers
 * and Providers are scoped by the module they are declared in. Modules and their
 * classes (Controllers and Providers) form a graph that determines how Nest
 * performs [Dependency Injection (DI)](https://docs.nestjs.com/providers#dependency-injection).
 *
 * @param metadata module configuration metadata
 *
 * @see [Modules](https://docs.nestjs.com/modules)
 *
 * @publicApi
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: object) => {
    for (const property in metadata) {
      if (metadata.hasOwnProperty(property)) {
        Reflect.defineMetadata(property, (metadata as any)[property], target);
      }
    }
  };
}

type CommonRouter = {
  (modelName: string, options?: ModelRouterProps): ClassDecorator;
  (options: RootRouterProps): ClassDecorator;
};

/**
 * Decorator that marks a class as a Nest controller that can receive inbound
 * requests and produce responses.
 *
 * An HTTP Controller responds to inbound HTTP Requests and produces HTTP Responses.
 * It defines a class that provides the context for one or more related route
 * handlers that correspond to HTTP request methods and associated routes
 * for example `GET /api/profile`, `POST /users/resume`.
 *
 * A Microservice Controller responds to requests as well as events, running over
 * a variety of transports [(read more here)](https://docs.nestjs.com/microservices/basics).
 * It defines a class that provides a context for one or more message or event
 * handlers.
 *
 * @param {object} options configuration object specifying:
 *
 * - `scope` - symbol that determines the lifetime of a Controller instance.
 * [See Scope](https://docs.nestjs.com/fundamentals/injection-scopes#usage) for
 * more details.
 * - `prefix` - string that defines a `route path prefix`.  The prefix
 * is pre-pended to the path specified in any request decorator in the class.
 * - `version` - string, array of strings, or Symbol that defines the version
 * of all routes in the class. [See Versioning](https://docs.nestjs.com/techniques/versioning)
 * for more details.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 * @see [Controllers](https://docs.nestjs.com/controllers)
 * @see [Microservices](https://docs.nestjs.com/microservices/basics#request-response)
 * @see [Versioning](https://docs.nestjs.com/techniques/versioning)
 *
 * @publicApi
 */
// export function Router(options: RootRouterProps): ClassDecorator;

function createRootRouter(options: RootRouterProps): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(ROOT_ROUTER_WATERMARK, true, target);
    Reflect.defineMetadata(ROUTER_OPTIONS, options || {}, target);
  };
}

function createModelRouter(modelName: string, options?: ModelRouterProps): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(ROUTER_WATERMARK, true, target);
    Reflect.defineMetadata(ROUTER_MODEL, modelName, target);
    Reflect.defineMetadata(ROUTER_OPTIONS, options || {}, target);
  };
}

const commonRouter = function Router(modelName: string | RootRouterProps, options?: ModelRouterProps): ClassDecorator {
  return isString(modelName) ? createModelRouter(modelName, options) : createRootRouter(modelName);
} as CommonRouter;

export const Router = commonRouter;
