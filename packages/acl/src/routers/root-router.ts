import JsonRouter from 'express-json-router';
import isArray from 'lodash/isArray';
import { setGenerators, MaclCore } from '../generators';
import { RootRouterOptions, ModelRouterOptions, Validation, RootQueryEntry, Request } from '../interfaces';
import { MIDDLEWARE, CORE, PERMISSIONS, PERMISSION_KEYS } from '../symbols';

const clientErrors = JsonRouter.clientErrors;

export class RootRouter {
  router: JsonRouter;
  basename: string;
  routeGuard: Validation;

  constructor(options: RootRouterOptions = { basePath: '', routeGuard: true }) {
    const { basePath, routeGuard } = options;

    this.router = new JsonRouter();
    this.basename = basePath || '';
    this.routeGuard = routeGuard;

    this.setRoutes();
  }

  private setRoutes() {
    this.router.post(`${this.basename}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._canActivate(this.routeGuard);
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const items = req.body || [];
      return Promise.all(
        items.map((item: RootQueryEntry) => {
          if (!['list', 'create', 'empty', 'read', 'update', 'delete', 'distinct', 'count'].includes(item.operation))
            return null;

          const ctl = req[CORE]._public(item.modelName);
          const op = ctl[`_${item.operation}`].bind(ctl);
          return isArray(item.arguments) ? op(...item.arguments) : op(item.arguments);
        }),
      );
    });
  }

  get routes() {
    return this.router.original;
  }
}
