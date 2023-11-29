import { Response, NextFunction } from 'express';
import mongoose, { Model } from 'mongoose';
import assign from 'lodash/assign';
import castArray from 'lodash/castArray';
import compact from 'lodash/compact';
import difference from 'lodash/difference';
import forEach from 'lodash/forEach';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isNaN from 'lodash/isNaN';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isNil from 'lodash/isNil';
import noop from 'lodash/noop';
import pick from 'lodash/pick';
import set from 'lodash/set';
import reduce from 'lodash/reduce';
import { getGlobalOption, getDataOption } from './options';
import {
  Populate,
  Projection,
  Filter,
  MiddlewareContext,
  Validation,
  Request,
  SelectAccess,
  RouteGuardAccess,
  DocPermissionsAccess,
  BaseFilterAccess,
  DecorateAccess,
  DecorateAllAccess,
  ValidateAccess,
  PrepareAccess,
  TransformAccess,
  Task,
} from './interfaces';
import Permission, { Permissions } from './permission';
import { DataService } from './services';
import { normalizeSelect, createValidator, setDocValue, toObject, pickDocFields, genPagination } from './helpers';
import { copyAndDepopulate } from './processors';
import { isDocument, arrToObj } from './lib';
import { DATA_MIDDLEWARE, PERMISSIONS, PERMISSION_KEYS } from './symbols';
import { Cache } from './cache';

export class DataCore {
  private req: Request;
  private caches: {
    baseFilter: Cache<string, any>;
  };

  constructor(req: Request) {
    this.req = req;
    this.caches = {
      baseFilter: new Cache<string, any>(),
    };
  }

  async genIDFilter(dataName: string, id: string) {
    const identifier = getDataOption(dataName, 'identifier');

    if (isString(identifier)) {
      return { [identifier]: id };
    }

    if (isFunction(identifier)) {
      return identifier.call(this.req, id);
    }

    return { _id: id };
  }

  async genFilter(dataName: string, access: BaseFilterAccess = 'read', _filter: Filter = null): Promise<Filter> {
    const baseFilterFn = getDataOption(dataName, `baseFilter.${access}`, null);
    if (!isFunction(baseFilterFn)) return _filter || {};

    const cacheKey = `${dataName}_baseFilter_${access}`;
    if (this.caches.baseFilter.has(cacheKey)) {
      return this.caches.baseFilter.get(cacheKey);
    }

    const permissions = this.getGlobalPermissions();

    const baseFilter = await baseFilterFn.call(this.req, permissions);
    if (baseFilter === false) return false;
    if (baseFilter === true || isEmpty(baseFilter)) return _filter || {};
    if (!_filter) return baseFilter;

    const result = { $and: [baseFilter, _filter] };
    this.caches.baseFilter.set(cacheKey, result);
    return result;
  }

  async genAllowedFields(dataName: string, doc: any, access: SelectAccess, baseFields = []) {
    let fields = [...baseFields] || [];

    const permissionSchema = getDataOption(dataName, 'permissionSchema');
    if (!permissionSchema) return fields;

    const permissions = this.getGlobalPermissions();

    // get keys from permission schema as some fields might not be filled when created
    const keys = Object.keys(permissionSchema);

    const phas = (key) => permissions.has(key);
    const { stringHandler, arrayHandler } = createValidator(phas);

    for (let x = 0; x < keys.length; x++) {
      const key = keys[x];
      if (baseFields.includes(key)) continue;

      const val = permissionSchema[key];
      const value = (val && val[access]) || val;

      if (isBoolean(value)) {
        if (value) fields.push(key);
      } else if (isString(value)) {
        if (stringHandler(value)) fields.push(key);
      } else if (isArray(value)) {
        if (arrayHandler(value)) fields.push(key);
      } else if (isFunction(value)) {
        if (await value.call(this.req, permissions)) fields.push(key);
      }
    }

    return fields;
  }

  async pickAllowedFields(dataName: string, doc: any, access: SelectAccess, baseFields = []) {
    const allowed = await this.genAllowedFields(dataName, doc, access, baseFields);
    return pickDocFields(doc, allowed);
  }

  async genSelect(
    dataName: string,
    access: SelectAccess,
    targetFields: Projection = null,
    skipChecks = true,
    subPaths = [],
  ) {
    let normalizedSelect = normalizeSelect(targetFields);
    let fields = [];

    const permissionSchema = getDataOption(dataName, ['permissionSchema'].concat(subPaths).join('.'));
    if (!permissionSchema) return fields;

    const permissions = this.getGlobalPermissions();

    const phas = (key) => {
      if (permissions.prop(key)) {
        if (permissions.has(key)) return true;
      } else if (skipChecks) {
        return true;
      }

      return false;
    };

    const { stringHandler, arrayHandler } = createValidator(phas);

    const keys = Object.keys(permissionSchema);
    for (let x = 0; x < keys.length; x++) {
      const key = keys[x];
      const val = permissionSchema[key];
      const value = val[access] || val;

      if (isBoolean(value)) {
        if (value) fields.push(key);
      } else if (isString(value)) {
        if (stringHandler(value)) fields.push(key);
      } else if (isArray(value)) {
        if (arrayHandler(value)) fields.push(key);
      } else if (isFunction(value)) {
        if (await value.call(this.req, permissions)) fields.push(key);
      }
    }

    fields = intersection(normalizedSelect, fields);
    return fields;
  }

  async decorate(dataName: string, doc: any, access: DecorateAccess, context: MiddlewareContext = {}) {
    const decorate = getDataOption(dataName, `decorate.${access}`, null);

    const permissions = this.getGlobalPermissions();
    return this.callMiddleware(decorate, doc, permissions, context);
  }

  async decorateAll(dataName: string, docs: any[], access: DecorateAllAccess) {
    const decorateAll = getDataOption(dataName, `decorateAll.${access}`, null);
    const permissions = this.getGlobalPermissions();

    return this.callMiddleware(decorateAll, docs, permissions, {});
  }

  getPermissions() {
    const permissionField = getGlobalOption('permissionField');
    return new Permission(this.req[permissionField] || {});
  }

  async setPermissions() {
    const permissionField = getGlobalOption('permissionField');
    if (this.req[permissionField]) return;

    const globalPermissions = getGlobalOption('globalPermissions');
    if (isFunction(globalPermissions)) {
      const gp = await globalPermissions.call(this.req, this.req);
      if (isPlainObject(gp)) this.req[permissionField] = gp;
      else if (isArray(gp)) this.req[permissionField] = arrToObj(gp);
      else if (isString(gp)) this.req[permissionField] = { [gp]: true };
    }
  }

  async canActivate(routeGuard: Validation) {
    let allowed = false;

    const permissions = this.getGlobalPermissions();
    const phas = (key) => permissions.has(key);
    const { stringHandler, arrayHandler } = createValidator(phas);

    if (isBoolean(routeGuard)) {
      allowed = routeGuard === true;
    } else if (isString(routeGuard)) {
      allowed = stringHandler(routeGuard);
    } else if (isArray(routeGuard)) {
      allowed = arrayHandler(routeGuard);
    } else if (isFunction(routeGuard)) {
      allowed = routeGuard.call(this.req, permissions);
    }

    return allowed;
  }

  async isAllowed(dataName: string, access: RouteGuardAccess | string) {
    const routeGuard = getDataOption(dataName, `routeGuard.${access}`);
    return this.canActivate(routeGuard);
  }

  getService(dataName: string) {
    return new DataService(this.req, dataName);
  }

  service(dataName: string) {
    return this.getService(dataName);
  }

  svc(dataName: string) {
    return this.getService(dataName);
  }

  private getGlobalPermissions() {
    return this.req[PERMISSIONS] as Permission;
  }

  private async callMiddleware(
    middleware: Function | Function[],
    doc: any,
    permissions: Permissions,
    context: MiddlewareContext,
  ) {
    middleware = castArray(middleware);
    for (let x = 0; x < middleware.length; x++) {
      if (isFunction(middleware[x])) {
        doc = await middleware[x].call(this.req, doc, permissions, context);
      }
    }

    return doc;
  }
}

export async function setDataCore(req: Request, res: Response, next: NextFunction) {
  if (req[DATA_MIDDLEWARE]) return next();

  const core = new DataCore(req);
  await core.setPermissions();

  req.dacl = core;
  req[PERMISSIONS] = core.getPermissions();
  req[PERMISSION_KEYS] = req[PERMISSIONS].$_permissionKeys;
  req[DATA_MIDDLEWARE] = true;

  next();
}
