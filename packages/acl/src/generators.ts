import mongoose, { Model } from 'mongoose';
import { Request } from 'express';
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
import { MIDDLEWARE, CORE, PERMISSIONS, PERMISSION_KEYS } from './symbols';

const callMiddleware = async (
  req: any,
  middleware: Function | Function[],
  doc: any,
  permissions: Permissions,
  context: MiddlewareContext,
) => {
  middleware = castArray(middleware);
  for (let x = 0; x < middleware.length; x++) {
    if (isFunction(middleware[x])) {
      doc = await middleware[x].call(req, doc, permissions, context);
    }
  }

  return doc;
};

export async function genIDFilter(modelName: string, id: string) {
  const identifier = getModelOption(modelName, 'identifier');

  if (isString(identifier)) {
    return { [identifier]: id };
  } else if (isFunction(identifier)) {
    return identifier.call(this, id);
  }

  return { _id: id };
}

export async function genFilter(modelName: string, access: BaseFilterAccess = 'read', _filter: any = null) {
  let baseFilterFn = getModelOption(modelName, `baseFilter.${access}`, null);
  // @Deprecated option 'baseQuery'
  if (!baseFilterFn) baseFilterFn = getModelOption(modelName, `baseQuery.${access}` as any, null);
  if (!isFunction(baseFilterFn)) return _filter || {};

  const permissions = this[PERMISSIONS];

  const baseFilter = await baseFilterFn.call(this, permissions);
  if (baseFilter === false) return false;
  if (baseFilter === true || isEmpty(baseFilter)) return _filter || {};
  if (!_filter) return baseFilter;

  return { $and: [baseFilter, _filter] };
}

export async function genAllowedFields(modelName: string, doc: any, access: SelectAccess, baseFields = []) {
  let fields = [...baseFields] || [];

  const permissionSchema = getModelOption(modelName, 'permissionSchema');
  if (!permissionSchema) return fields;

  const permissions = this[PERMISSIONS];
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
      if (await value.call(this, permissions, docPermissions)) fields.push(key);
    }
  }

  return fields;
}

export async function pickAllowedFields(modelName: string, doc: any, access: SelectAccess, baseFields = []) {
  const allowed = await this[CORE]._genAllowedFields(modelName, doc, access, baseFields);
  return pickDocFields(doc, allowed);
}

export async function genSelect(
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

  const permissions = this[PERMISSIONS];

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
      if (await value.call(this, permissions)) fields.push(key);
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

export async function genPopulate(modelName: string, access: SelectAccess = 'read', _populate: any = null) {
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
        ret.select = await this[CORE]._genSelect(refModelName, access, ret.select, false);
        const filter = await this[CORE]._genFilter(refModelName, access, null);
        if (filter === false) return null;

        ret.match = filter;
        return ret;
      }),
    ),
  );

  return populate;
}

export async function validate(
  modelName: string,
  allowedData: any,
  access: ValidateAccess,
  context: MiddlewareContext = {},
) {
  const validate = getModelOption(modelName, `validate.${access}`, null);

  if (isFunction(validate)) {
    const permissions = this[PERMISSIONS];
    return validate.call(this, allowedData, permissions, context) as boolean | any[];
  } else if (isBoolean(validate) || isArray(validate)) {
    return validate;
  } else {
    return true;
  }
}

export async function prepare(
  modelName: string,
  allowedData: any,
  access: PrepareAccess,
  context: MiddlewareContext = {},
) {
  const prepare = getModelOption(modelName, `prepare.${access}`, null);
  const permissions = this[PERMISSIONS];
  return callMiddleware(this, prepare, allowedData, permissions, context);
}

export async function transform(modelName: string, doc: any, access: TransformAccess, context: MiddlewareContext = {}) {
  const transform = getModelOption(modelName, `transform.${access}`, null);
  const permissions = this[PERMISSIONS];
  return callMiddleware(this, transform, doc, permissions, context);
}

export async function genDocPermissions(
  modelName: string,
  doc: any,
  access: DocPermissionsAccess,
  context: MiddlewareContext = {},
) {
  const docPermissionsFn = getModelOption(modelName, `docPermissions.${access}`, null);
  let docPermissions = {};

  if (isFunction(docPermissionsFn)) {
    const permissions = this[PERMISSIONS];
    docPermissions = await docPermissionsFn.call(this, doc, permissions, context);
  }

  return docPermissions;
}

export async function addDocPermissions(
  modelName: string,
  doc: any,
  access: DocPermissionsAccess,
  context: MiddlewareContext = {},
) {
  const docPermissionField = getModelOption(modelName, 'permissionField');
  const docPermissions = await this[CORE]._genDocPermissions(modelName, doc, access, context);
  setDocPermissions(doc, docPermissionField, docPermissions);
  return doc;
}

const exists = async (req: Request, model: Model<any>, doc: any, access: DocPermissionsAccess) => {
  const filter = await req[CORE]._genFilter(model.modelName, access, { _id: doc._id });
  if (filter === false) return false;
  const result = await model.exists(filter);
  if (!result) return false;

  return !!result._id;
};

export async function addFieldPermissions(
  modelName: string,
  doc: any,
  access: DocPermissionsAccess,
  context: MiddlewareContext = {},
) {
  const model = mongoose.model(modelName);
  const docPermissionField = getModelOption(modelName, 'permissionField');

  // TODO: do we need falsy fields as well?
  // const permissionSchemaKeys = getModelOption(modelName, 'permissionSchemaKeys');

  let readExists = true;
  let updateExists = true;

  if (access !== 'read') {
    readExists = await exists(this, model, doc, 'read');
  }

  if (access !== 'update') {
    updateExists = await exists(this, model, doc, 'update');
  }

  const [views, edits] = await Promise.all([
    readExists ? this[CORE]._genAllowedFields(modelName, doc, 'read') : [],
    updateExists ? this[CORE]._genAllowedFields(modelName, doc, 'update') : [],
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

export async function decorate(modelName: string, doc: any, access: DecorateAccess, context: MiddlewareContext = {}) {
  const decorate = getModelOption(modelName, `decorate.${access}`, null);

  const permissions = this[PERMISSIONS];
  context.docPermissions = getDocPermissions(modelName, doc);

  return callMiddleware(this, decorate, doc, permissions, context);
}

export async function decorateAll(modelName: string, docs: any[], access: DecorateAllAccess) {
  const decorateAll = getModelOption(modelName, `decorateAll.${access}`, null);
  const permissions = this[PERMISSIONS];

  return callMiddleware(this, decorateAll, docs, permissions, {});
}

export function process(modelName: string, docObject: any, pipeline) {
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

export function getPermissions() {
  const permissionField = getGlobalOption('permissionField');
  return new Permission(this[permissionField] || {});
}

export async function setPermissions() {
  const permissionField = getGlobalOption('permissionField');
  if (this[permissionField]) return;

  const globalPermissions = getGlobalOption('globalPermissions');
  if (isFunction(globalPermissions)) {
    const gp = await globalPermissions.call(this, this);
    if (isPlainObject(gp)) this[permissionField] = gp;
    else if (isArray(gp)) this[permissionField] = arrToObj(gp);
    else if (isString(gp)) this[permissionField] = { [gp]: true };
  }
}

export async function canActivate(routeGuard: Validation) {
  let allowed = false;

  const permissions = this[PERMISSIONS];
  const phas = (key) => permissions.has(key);
  const [stringHandler, arrayHandler] = createValidator(phas);

  if (isBoolean(routeGuard)) {
    return routeGuard === true;
  } else if (isString(routeGuard)) {
    return stringHandler(routeGuard);
  } else if (isArray(routeGuard)) {
    return arrayHandler(routeGuard);
  } else if (isFunction(routeGuard)) {
    return routeGuard.call(this, permissions);
  }

  return allowed;
}

export async function isAllowed(modelName: string, access: RouteGuardAccess) {
  const routeGuard = getModelOption(modelName, `routeGuard.${access}`);
  return this[CORE]._canActivate(routeGuard);
}

export function getController(modelName: string) {
  return new Controller(this, modelName);
}

export function getPublicController(modelName: string) {
  return new PublicController(this, modelName);
}

export interface MaclCore {
  _genIDFilter: typeof genIDFilter;
  _genFilter: typeof genFilter;
  _genPagination: typeof genPagination;
  _genAllowedFields: typeof genAllowedFields;
  _genSelect: typeof genSelect;
  _pickAllowedFields: typeof pickAllowedFields;
  _genPopulate: typeof genPopulate;
  _genDocPermissions: typeof genDocPermissions;
  _validate: typeof validate;
  _prepare: typeof prepare;
  _transform: typeof transform;
  _addDocPermissions: typeof addDocPermissions;
  _addFieldPermissions: typeof addFieldPermissions;
  _decorate: typeof decorate;
  _decorateAll: typeof decorateAll;
  _process: typeof process;
  _getPermissions: typeof getPermissions;
  _setPermissions: typeof setPermissions;
  _canActivate: typeof canActivate;
  _isAllowed: typeof isAllowed;
  _public: typeof getPublicController;
}

export type ControllerFactory = typeof getController;

export async function setGenerators(req, res, next) {
  if (req[MIDDLEWARE]) return next();
  req[CORE] = {
    _genIDFilter: genIDFilter.bind(req),
    _genFilter: genFilter.bind(req),
    _genPagination: genPagination.bind(req),
    _genAllowedFields: genAllowedFields.bind(req),
    _genSelect: genSelect.bind(req),
    _pickAllowedFields: pickAllowedFields.bind(req),
    _genPopulate: genPopulate.bind(req),
    _genDocPermissions: genDocPermissions.bind(req),
    _validate: validate.bind(req),
    _prepare: prepare.bind(req),
    _transform: transform.bind(req),
    _addDocPermissions: addDocPermissions.bind(req),
    _addFieldPermissions: addFieldPermissions.bind(req),
    _decorate: decorate.bind(req),
    _decorateAll: decorateAll.bind(req),
    _process: process.bind(req),
    _getPermissions: getPermissions.bind(req),
    _setPermissions: setPermissions.bind(req),
    _canActivate: canActivate.bind(req),
    _isAllowed: isAllowed.bind(req),
    _public: getPublicController.bind(req),
  } as MaclCore;

  req.macl = getController.bind(req);
  assign(req.macl, req[CORE]);

  // backward compatibility
  assign(req, req[CORE]);

  await req[CORE]._setPermissions();
  req[PERMISSIONS] = req.permissions = req[CORE]._getPermissions();
  req[PERMISSION_KEYS] = req[PERMISSIONS].$_permissionKeys;
  req[MIDDLEWARE] = true;
  next();
}
