import { Response, NextFunction } from 'express';
import mongoose, { Model } from 'mongoose';
import assign from 'lodash/assign';
import castArray from 'lodash/castArray';
import compact from 'lodash/compact';
import difference from 'lodash/difference';
import forEach from 'lodash/forEach';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import isUndefined from 'lodash/isUndefined';
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
import { getGlobalOption, getModelOption, getExactModelOption } from './options';
import { getModelRef } from './meta';
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
  FinalizeAccess,
  Task,
} from './interfaces';
import Permission, { Permissions } from './permission';
import { Service, PublicService, Base } from './services';
import {
  normalizeSelect,
  createValidator,
  getDocPermissions,
  setDocValue,
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

  async genFilter(modelName: string, access: BaseFilterAccess = 'read', _filter: Filter = null): Promise<Filter> {
    const permissions = this.getGlobalPermissions();

    let overrideFilterFn = getModelOption(modelName, `overrideFilter.${access}`, null);
    if (isFunction(overrideFilterFn)) {
      _filter = await overrideFilterFn.call(this.req, _filter, permissions);
    }

    let baseFilterFn = getModelOption(modelName, `baseFilter.${access}`, null);
    if (!isFunction(baseFilterFn)) return _filter || {};

    let baseFilter = null;
    const cacheKey = `${modelName}_baseFilter_${access}`;
    if (this.caches.baseFilter.has(cacheKey)) {
      baseFilter = this.caches.baseFilter.get(cacheKey);
    } else {
      baseFilter = await baseFilterFn.call(this.req, permissions);
    }

    if (baseFilter === false) return false;
    if (baseFilter === true || isEmpty(baseFilter)) return _filter || {};
    if (!_filter) return baseFilter;

    const result = { $and: [baseFilter, _filter] };
    this.caches.baseFilter.set(cacheKey, result);
    return result;
  }

  private removePrefix(str, prefix) {
    if (!prefix) return str;

    if (str.startsWith(prefix)) {
      return str.substring(prefix.length);
    }
    return str;
  }

  async genAllowedFields(modelName: string, doc: any, access: SelectAccess, baseFields = []) {
    let fields = [...(baseFields ?? [])];

    const permissionSchema = getModelOption(modelName, 'permissionSchema');
    if (!permissionSchema) return fields;

    const modelPermissionPrefix = getModelOption(modelName, 'modelPermissionPrefix', '');

    const permissions = this.getGlobalPermissions();
    const docPermissions = getDocPermissions(modelName, doc);
    // get keys from permission schema as some fields might not be filled when created
    const keys = Object.keys(permissionSchema);
    // const keys = getModelKeys(doc);

    const phas = (key) => permissions.has(key) || docPermissions[this.removePrefix(key, modelPermissionPrefix)];
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

    const permissionSchema = getModelOption(modelName, ['permissionSchema'].concat(subPaths).join('.'));
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

  async validate(modelName: string, allowedData: any, access: ValidateAccess, context: MiddlewareContext) {
    const validate = getModelOption(modelName, `validate.${access}`, null);

    if (isFunction(validate)) {
      const permissions = this.getGlobalPermissions();
      return validate.call(this.req, allowedData, permissions, context) as boolean | any[];
    } else if (isBoolean(validate) || isArray(validate)) {
      return validate;
    } else {
      return true;
    }
  }

  async prepare(modelName: string, allowedData: any, access: PrepareAccess, context: MiddlewareContext) {
    const prepare = getModelOption(modelName, `prepare.${access}`, null);
    const permissions = this.getGlobalPermissions();
    return this.callMiddleware(prepare, allowedData, permissions, context);
  }

  async transform(modelName: string, doc: any, access: TransformAccess, context: MiddlewareContext) {
    const transform = getModelOption(modelName, `transform.${access}`, null);
    const permissions = this.getGlobalPermissions();
    return this.callMiddleware(transform, doc, permissions, context);
  }

  async finalize(modelName: string, doc: any, access: FinalizeAccess, context: MiddlewareContext) {
    const finalize = getModelOption(modelName, `finalize.${access}`, null);
    const permissions = this.getGlobalPermissions();
    return this.callMiddleware(finalize, doc, permissions, context);
  }

  async changes(modelName: string, doc: any, context: MiddlewareContext) {
    const changeOptions = getModelOption(modelName, `change`, {});

    for (let x = 0; x < context.modifiedPaths.length; x++) {
      const mpath = context.modifiedPaths[x];

      if (isFunction(changeOptions[mpath])) {
        await changeOptions[mpath].call(
          this.req,
          context.originalDocObject[mpath],
          doc[mpath],
          context.changes.filter((di) => di.path.length > 0 && di.path[0] === mpath),
          context,
        );
      }
    }
  }

  async genDocPermissions(modelName: string, doc: any, access: DocPermissionsAccess, context: MiddlewareContext) {
    const docPermissionsFn = getModelOption(modelName, `docPermissions.${access}`, null);
    let docPermissions = {};

    if (isFunction(docPermissionsFn)) {
      const permissions = this.getGlobalPermissions();
      try {
        docPermissions = await docPermissionsFn.call(this.req, doc, permissions, context);
      } catch {}
    }

    return docPermissions;
  }

  addEmptyPermissions(modelName: string, doc: any) {
    const docPermissionField = getModelOption(modelName, 'permissionField');
    // Mongoose `toObject` method omits empty values
    setDocValue(doc, docPermissionField, { _view: { $: '_' }, _edit: { $: '_' } });
    return doc;
  }

  async addDocPermissions(modelName: string, doc: any, access: DocPermissionsAccess, context: MiddlewareContext) {
    const docPermissionField = getModelOption(modelName, 'permissionField');
    const docPermissions = await this.genDocPermissions(modelName, doc, access, context);
    setDocValue(doc, docPermissionField, docPermissions);
    return doc;
  }

  async addFieldPermissions(modelName: string, doc: any, access: DocPermissionsAccess, context: MiddlewareContext) {
    const svc = this.req.macl.getService(modelName);
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

    setDocValue(doc, `${docPermissionField}._view`, viewObj);
    setDocValue(doc, `${docPermissionField}._edit`, editObj);

    return doc;
  }

  async decorate(modelName: string, doc: any, access: DecorateAccess, context: MiddlewareContext) {
    const decorate = getModelOption(modelName, `decorate.${access}`, null);

    const permissions = this.getGlobalPermissions();
    context.docPermissions = getDocPermissions(modelName, doc);

    return this.callMiddleware(decorate, doc, permissions, context);
  }

  async decorateAll(modelName: string, docs: any[], access: DecorateAllAccess, context: MiddlewareContext) {
    const decorateAll = getModelOption(modelName, `decorateAll.${access}`, null);
    const permissions = this.getGlobalPermissions();

    return this.callMiddleware(decorateAll, docs, permissions, context);
  }

  runTasks(modelName: string, docObject: any, task: Task | Task[]) {
    const tasks = compact(castArray(task));
    if (tasks.length === 0) return docObject;

    forEach(tasks, (task) => {
      const { type, args, options } = task;

      switch (type) {
        case 'COPY_AND_DEPOPULATE':
          docObject = copyAndDepopulate(docObject, args, options);
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

  async isAllowed(modelName: string, access: RouteGuardAccess | string) {
    if (access.startsWith('subs')) {
      const keys = access.split('.');
      if (keys.length < 3) {
        return false;
      }

      const [, field, op] = keys;
      const subOption = getExactModelOption(modelName, `routeGuard.${access}`);
      if (isUndefined(subOption)) {
        const subFieldOption = getExactModelOption(modelName, `routeGuard.subs.${field}`);
        if (isUndefined(subFieldOption)) {
          const opOption = getModelOption(modelName, `routeGuard.${op}`);
          return this.canActivate(opOption);
        }

        return this.canActivate(subFieldOption);
      }

      return this.canActivate(subOption);
    }

    const routeGuard = getModelOption(modelName, `routeGuard.${access}`);
    return this.canActivate(routeGuard);
  }

  getService(modelName: string) {
    return new Service(this.req, modelName);
  }

  getPublicService(modelName: string) {
    return new PublicService(this.req, modelName);
  }

  service(modelName: string) {
    return this.getPublicService(modelName);
  }

  svc(modelName: string) {
    return this.getPublicService(modelName);
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
