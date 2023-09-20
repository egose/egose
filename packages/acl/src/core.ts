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
import { getGlobalOption, getModelOption } from './options';
import { getModelRef } from './meta';
import {
  Populate,
  Projection,
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
} from './interfaces';
import Permission, { Permissions } from './permission';
import { Controller, PublicController, Base } from './controllers';
import {
  normalizeSelect,
  createValidator,
  getDocPermissions,
  setDocPermissions,
  toObject,
  pickDocFields,
  genPagination,
} from './helpers';
import { copyAndDepopulate } from './processors';
import { isDocument, arrToObj } from './lib';
import { MIDDLEWARE, PERMISSIONS, PERMISSION_KEYS } from './symbols';
import { Cache } from './cache';

export class Core {
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

  async genIDFilter(modelName: string, id: string) {
    const identifier = getModelOption(modelName, 'identifier');

    if (isString(identifier)) {
      return { [identifier]: id };
    }

    if (isFunction(identifier)) {
      return identifier.call(this.req, id);
    }

    return { _id: id };
  }

  async genFilter(modelName: string, access: BaseFilterAccess = 'read', _filter: any = null) {
    let baseFilterFn = getModelOption(modelName, `baseFilter.${access}`, null);
    // @Deprecated option 'baseQuery'
    if (!baseFilterFn) baseFilterFn = getModelOption(modelName, `baseQuery.${access}` as any, null);
    if (!isFunction(baseFilterFn)) return _filter || {};

    const cacheKey = `${modelName}_baseFilter_${access}`;
    if (this.caches.baseFilter.has(cacheKey)) {
      return this.caches.baseFilter.get(cacheKey);
    }

    const permissions = this.getGlobalPermission();

    const baseFilter = await baseFilterFn.call(this.req, permissions);
    if (baseFilter === false) return false;
    if (baseFilter === true || isEmpty(baseFilter)) return _filter || {};
    if (!_filter) return baseFilter;

    const result = { $and: [baseFilter, _filter] };
    this.caches.baseFilter.set(cacheKey, result);
    return result;
  }

  async genAllowedFields(modelName: string, doc: any, access: SelectAccess, baseFields = []) {
    let fields = [...baseFields] || [];

    const permissionSchema = getModelOption(modelName, 'permissionSchema');
    if (!permissionSchema) return fields;

    const permissions = this.getGlobalPermission();
    const docPermissions = getDocPermissions(modelName, doc);
    // get keys from permission schema as some fields might not be filled when created
    const keys = Object.keys(permissionSchema);
    // const keys = getModelKeys(doc);

    const phas = (key) => permissions.has(key) || docPermissions[key];
    const [stringHandler, arrayHandler] = createValidator(phas);

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
        if (await value.call(this.req, permissions, docPermissions)) fields.push(key);
      }
    }

    return fields;
  }

  async pickAllowedFields(modelName: string, doc: any, access: SelectAccess, baseFields = []) {
    const allowed = await this.genAllowedFields(modelName, doc, access, baseFields);
    return pickDocFields(doc, allowed);
  }

  async genSelect(
    modelName: string,
    access: SelectAccess,
    targetFields: Projection = null,
    skipChecks = true,
    subPaths = [],
  ) {
    let normalizedSelect = normalizeSelect(targetFields);
    let fields = [];

    const permissionSchema = getModelOption(modelName, ['permissionSchema'].concat(subPaths).join('.') as any);
    if (!permissionSchema) return fields;

    const permissions = this.getGlobalPermission();

    const phas = (key) => {
      if (permissions.prop(key)) {
        if (permissions.has(key)) return true;
      } else if (skipChecks) {
        return true;
      }

      return false;
    };

    const [stringHandler, arrayHandler] = createValidator(phas);

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

    if (normalizedSelect.length > 0) {
      const excludeid = normalizedSelect.includes('-_id');
      const excludeall = normalizedSelect.every((v) => v.startsWith('-'));
      if (excludeall) {
        normalizedSelect = normalizedSelect.map((v) => v.substring(1));
        fields = difference(fields, normalizedSelect);
        if (excludeid) fields.push('-_id');
      } else {
        fields = intersection(normalizedSelect, fields.concat(excludeid ? '-_id' : '_id'));
      }
    }

    const mandatoryFields = subPaths.length > 0 ? [] : getModelOption(modelName, `mandatoryFields.${access}`, []);
    return fields.concat(mandatoryFields);
  }

  async genPopulate(modelName: string, access: SelectAccess | BaseFilterAccess = 'read', _populate: any = null) {
    if (!_populate) return [];

    let populate = Array.isArray(_populate) ? _populate : [_populate];
    populate = compact(
      await Promise.all(
        populate.map(async (p: Populate | string) => {
          const ret: Populate = isString(p)
            ? { path: p }
            : {
                path: p.path,
                select: normalizeSelect(p.select),
              };

          const refModelName = getModelRef(modelName, ret.path);
          if (!refModelName) return null;

          if (!isString(p) && p.access) access = p.access;
          ret.select = await this.genSelect(refModelName, access as SelectAccess, ret.select, false);
          const filter = await this.genFilter(refModelName, access as BaseFilterAccess, null);
          if (filter === false) return null;

          ret.match = filter;
          return ret;
        }),
      ),
    );

    return populate;
  }

  async validate(modelName: string, allowedData: any, access: ValidateAccess, context: MiddlewareContext = {}) {
    const validate = getModelOption(modelName, `validate.${access}`, null);

    if (isFunction(validate)) {
      const permissions = this.getGlobalPermission();
      return validate.call(this.req, allowedData, permissions, context) as boolean | any[];
    } else if (isBoolean(validate) || isArray(validate)) {
      return validate;
    } else {
      return true;
    }
  }

  async prepare(modelName: string, allowedData: any, access: PrepareAccess, context: MiddlewareContext = {}) {
    const prepare = getModelOption(modelName, `prepare.${access}`, null);
    const permissions = this.getGlobalPermission();
    return this.callMiddleware(prepare, allowedData, permissions, context);
  }

  async transform(modelName: string, doc: any, access: TransformAccess, context: MiddlewareContext = {}) {
    const transform = getModelOption(modelName, `transform.${access}`, null);
    const permissions = this[PERMISSIONS];
    return this.callMiddleware(transform, doc, permissions, context);
  }

  async genDocPermissions(modelName: string, doc: any, access: DocPermissionsAccess, context: MiddlewareContext = {}) {
    const docPermissionsFn = getModelOption(modelName, `docPermissions.${access}`, null);
    let docPermissions = {};

    if (isFunction(docPermissionsFn)) {
      const permissions = this.getGlobalPermission();
      try {
        docPermissions = await docPermissionsFn.call(this.req, doc, permissions, context);
      } catch {}
    }

    return docPermissions;
  }

  async addDocPermissions(modelName: string, doc: any, access: DocPermissionsAccess, context: MiddlewareContext = {}) {
    const docPermissionField = getModelOption(modelName, 'permissionField');
    const docPermissions = await this.genDocPermissions(modelName, doc, access, context);
    setDocPermissions(doc, docPermissionField, docPermissions);
    return doc;
  }

  async addFieldPermissions(
    modelName: string,
    doc: any,
    access: DocPermissionsAccess,
    context: MiddlewareContext = {},
  ) {
    const svc = this.req.macl.getController(modelName);
    const docPermissionField = getModelOption(modelName, 'permissionField');

    // TODO: do we need falsy fields as well?
    // const permissionSchemaKeys = getModelOption(modelName, 'permissionSchemaKeys');

    let readExists = true;
    let updateExists = true;

    if (access !== 'read') {
      readExists = (await svc.exists({ _id: doc._id }, { access: 'read' })).data;
    }

    if (access !== 'update') {
      updateExists = (await svc.exists({ _id: doc._id }, { access: 'update' })).data;
    }

    const [views, edits] = await Promise.all([
      readExists ? svc.genAllowedFields(doc, 'read') : [],
      updateExists ? svc.genAllowedFields(doc, 'update') : [],
    ]);

    const viewObj = reduce(
      views,
      (ret, view) => {
        ret[view] = true;
        return ret;
      },
      {},
    );

    const editObj = reduce(
      edits,
      (ret, view) => {
        ret[view] = true;
        return ret;
      },
      {},
    );

    setDocPermissions(doc, `${docPermissionField}._view`, viewObj);
    setDocPermissions(doc, `${docPermissionField}._edit`, editObj);

    return doc;
  }

  async decorate(modelName: string, doc: any, access: DecorateAccess, context: MiddlewareContext = {}) {
    const decorate = getModelOption(modelName, `decorate.${access}`, null);

    const permissions = this.getGlobalPermission();
    context.docPermissions = getDocPermissions(modelName, doc);

    return this.callMiddleware(decorate, doc, permissions, context);
  }

  async decorateAll(modelName: string, docs: any[], access: DecorateAllAccess) {
    const decorateAll = getModelOption(modelName, `decorateAll.${access}`, null);
    const permissions = this.getGlobalPermission();

    return this.callMiddleware(decorateAll, docs, permissions, {});
  }

  process(modelName: string, docObject: any, pipeline) {
    const pipelines = compact(castArray(pipeline));
    if (pipelines.length === 0) return docObject;

    forEach(pipelines, (pipeline) => {
      const { type, operations, options } = pipeline;

      switch (type) {
        case 'COPY_AND_DEPOPULATE':
          docObject = copyAndDepopulate(docObject, operations, options);
          break;
      }
    });

    return docObject;
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

    const permissions = this.getGlobalPermission();
    const phas = (key) => permissions.has(key);
    const [stringHandler, arrayHandler] = createValidator(phas);

    if (isBoolean(routeGuard)) {
      return routeGuard === true;
    } else if (isString(routeGuard)) {
      return stringHandler(routeGuard);
    } else if (isArray(routeGuard)) {
      return arrayHandler(routeGuard);
    } else if (isFunction(routeGuard)) {
      return routeGuard.call(this.req, permissions);
    }

    return allowed;
  }

  async isAllowed(modelName: string, access: RouteGuardAccess) {
    const routeGuard = getModelOption(modelName, `routeGuard.${access}`);
    return this.canActivate(routeGuard);
  }

  getController(modelName: string) {
    return new Controller(this.req, modelName);
  }

  getPublicController(modelName: string) {
    return new PublicController(this.req, modelName);
  }

  private getGlobalPermission() {
    return this.req[PERMISSIONS];
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

export async function setCore(req: Request, res: Response, next: NextFunction) {
  if (req[MIDDLEWARE]) return next();

  const core = new Core(req);
  await core.setPermissions();

  req.macl = core;
  req[PERMISSIONS] = core.getPermissions();
  req[PERMISSION_KEYS] = req[PERMISSIONS].$_permissionKeys;
  req[MIDDLEWARE] = true;

  next();
}
