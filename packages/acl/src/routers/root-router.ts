import JsonRouter from 'express-json-router';
import castArray from 'lodash/castArray';
import { setCore } from '../core';
import { mapCodeToMessage, mapCodeToStatusCode } from '../helpers';
import { getGlobalOption, getModelOption } from '../options';
import {
  RootRouterOptions,
  ModelRouterOptions,
  Validation,
  RootQueryEntry,
  Request,
  ControllerResult,
  RouteGuardAccess,
} from '../interfaces';
import { MIDDLEWARE, PERMISSIONS, PERMISSION_KEYS } from '../symbols';
import { Codes, StatusCodes } from '../enums';

const clientErrors = JsonRouter.clientErrors;

const ALL_ROUTES = ['new', 'list', 'read', 'update', 'delete', 'create', 'distinct', 'count'];

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

  private processResult(op: string, { success, code, data, count, totalCount, errors }: ControllerResult) {
    const message = mapCodeToMessage(code);
    const statusCode = mapCodeToStatusCode(code);
    return { success, code, data, count, totalCount, errors, message, statusCode, op };
  }

  private setRoutes() {
    this.router.post(`${this.basename}`, setCore, async (req: Request) => {
      const allowed = await req.macl.canActivate(this.routeGuard);
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const items = req.body || [];
      return Promise.all(
        items.map(async (item: RootQueryEntry) => {
          const ctl = req.macl.getPublicController(item.model);
          if (!ctl)
            return { success: false, code: Codes.BadRequest, data: null, message: `Model ${item.model} not found` };

          if (!ALL_ROUTES.includes(item.op))
            return { success: false, code: Codes.BadRequest, data: null, message: `Operation ${item.op} not found` };

          const routeGuard = getModelOption(item.model, `routeGuard.${item.op as RouteGuardAccess}`);
          const allowed = await req.macl.canActivate(routeGuard);
          if (!allowed) return { success: false, code: Codes.Unauthorized, data: null, message: 'Unauthorized' };

          if (item.op === 'list') {
            return this.processResult(item.op, await ctl._list(item.filter, item.args, item.options));
          } else if (item.op === 'create') {
            return this.processResult(item.op, await ctl._create(item.data, item.args));
          } else if (item.op === 'new') {
            return this.processResult(item.op, await ctl._new());
          } else if (item.op === 'read') {
            return this.processResult(item.op, await ctl._read(item.id, item.args, item.options));
          } else if (item.op === 'update') {
            return this.processResult(item.op, await ctl._update(item.id, item.args, item.options));
          } else if (item.op === 'delete') {
            return this.processResult(item.op, await ctl._delete(item.id));
          } else if (item.op === 'distinct') {
            return this.processResult(item.op, await ctl._distinct(item.field, { filter: item.filter }));
          } else if (item.op === 'count') {
            return this.processResult(item.op, await ctl._count(item.filter));
          } else {
            return { success: false, code: Codes.BadRequest, data: null, message: `operation ${item.op} not found` };
          }
        }),
      );
    });
  }

  get routes() {
    return this.router.original;
  }
}
