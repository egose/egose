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
import noop from 'lodash/noop';
import pick from 'lodash/pick';
import set from 'lodash/set';
import { getGlobalOption, getModelOption } from './options';
import { getModelRef } from './meta';
import { Populate, Projection, MiddlewareContext, Validation } from './interfaces';
import Permission, { Permissions } from './permission';
import Controller from './controller';
import PublicController from './controller-public';
import { normalizeSelect, arrToObj, createValidator } from './helpers';
import { copyAndDepopulate } from './processors';
import { isDocument } from './lib';
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

export async function genIDQuery(modelName: string, id: string) {
  const identifier = getModelOption(modelName, 'identifier', '_id');

  if (isString(identifier)) {
    return { [identifier]: id };
  } else if (isFunction(identifier)) {
    return identifier.call(this, id);
  }

  return { _id: id };
}

export async function genQuery(modelName: string, access: string = 'read', _query: any = null) {
  const baseQueryFn = getModelOption(modelName, `baseQuery.${access}`, null);
  if (!isFunction(baseQueryFn)) return _query || {};

  const permissions = this[PERMISSIONS];

  const baseQuery = await baseQueryFn.call(this, permissions);
  if (baseQuery === false) return false;
  if (baseQuery === true || isEmpty(baseQuery)) return _query || {};
  if (!_query) return baseQuery;

  return { $and: [baseQuery, _query] };
}

export function genPagination(
  {
    page = 1,
    limit,
  }: {
    page?: number | string;
    limit: any;
  },
  hardLimit,
) {
  limit = Number(limit);
  page = Number(page);
  if (isNaN(limit) || limit > hardLimit) limit = hardLimit;

  const options: { limit: string; skip?: number } = { limit };
  if (page > 1) options.skip = (page - 1) * limit;
  return options;
}

function getDocPermissions(modelName, doc) {
  const docPermissionField = getModelOption(modelName, 'permissionField', '_permissions');
  let docPermissions = {};
  if (isDocument(doc)) {
    docPermissions = (doc._doc && doc._doc[docPermissionField]) || {};
  } else if (isPlainObject(doc)) {
    docPermissions = doc[docPermissionField] || {};
  }

  return docPermissions;
}

function setDocPermissions(doc, path, value) {
  if (isDocument(doc)) {
    set(doc._doc, path, value);
  } else if (isPlainObject(doc)) {
    set(doc, path, value);
  }
}

function getModelKeys(doc) {
  return Object.keys(isDocument(doc) ? doc._doc : doc);
}

function toObject(doc) {
  return isDocument(doc) ? doc.toObject() : doc;
}

export async function genAllowedFields(modelName: string, doc: any, access: string, baseFields = []) {
  let fields = baseFields || [];

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

export async function pickAllowedFields(modelName: string, doc: any, access: string, baseFields = []) {
  const allowed = await this[CORE]._genAllowedFields(modelName, doc, access, baseFields);
  return pick(toObject(doc), allowed);
}

export async function genSelect(
  modelName: string,
  access: string,
  targetFields: Projection | null = null,
  skipChecks = true,
  subPaths = [],
) {
  let normalizedSelect = normalizeSelect(targetFields);
  let fields = [];

  const permissionSchema = getModelOption(modelName, ['permissionSchema'].concat(subPaths).join('.'));
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

  const mandatoryFields = subPaths.length > 0 ? [] : getModelOption(modelName, 'mandatoryFields', []);
  return fields.concat(mandatoryFields);
}

export async function genPopulate(modelName: string, access: string = 'read', _populate: any = null) {
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
        const query = await this[CORE]._genQuery(refModelName, access, null);
        if (query === false) return null;

        ret.match = query;
        return ret;
      }),
    ),
  );

  return populate;
}

export async function validate(modelName: string, allowedData: any, access: string, context: MiddlewareContext = {}) {
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

export async function prepare(modelName: string, allowedData: any, access: string, context: MiddlewareContext = {}) {
  const prepare = getModelOption(modelName, `prepare.${access}`, null);
  const permissions = this[PERMISSIONS];
  return callMiddleware(this, prepare, allowedData, permissions, context);
}

export async function transform(modelName: string, doc: any, access: string, context: MiddlewareContext = {}) {
  const transform = getModelOption(modelName, `transform.${access}`, null);
  const permissions = this[PERMISSIONS];
  return callMiddleware(this, transform, doc, permissions, context);
}

export async function genDocPermissions(modelName: string, doc: any, access: string, context: MiddlewareContext = {}) {
  const permit = getModelOption(modelName, `docPermissions.${access}`, null);
  let docPermissions = {};

  if (isFunction(permit)) {
    const permissions = this[PERMISSIONS];
    docPermissions = await permit.call(this, doc, permissions, context);
  }

  return docPermissions;
}

export async function permit(modelName: string, doc: any, access: string, context: MiddlewareContext = {}) {
  const docPermissionField = getModelOption(modelName, 'permissionField', '_permissions');
  const docPermissions = await this[CORE]._genDocPermissions(modelName, doc, access, context);
  setDocPermissions(doc, docPermissionField, docPermissions);

  const allowedFields = await this[CORE]._genAllowedFields(modelName, doc, 'update');
  // TODO: do we need falsy fields as well?
  // const permissionSchemaKeys = getModelOption(modelName, 'permissionSchemaKeys');

  // TODO: make it flexible structure
  forEach(allowedFields, (field) => {
    setDocPermissions(doc, `${docPermissionField}.edit.${field}`, true);
  });

  return doc;
}

export async function decorate(modelName: string, doc: any, access: string, context: MiddlewareContext = {}) {
  const decorate = getModelOption(modelName, `decorate.${access}`, null);

  const permissions = this[PERMISSIONS];
  context.docPermissions = getDocPermissions(modelName, doc);

  return callMiddleware(this, decorate, doc, permissions, context);
}

export async function decorateAll(modelName: string, docs: any[], access: string) {
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

export async function isAllowed(modelName, access) {
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
  _genIDQuery: typeof genIDQuery;
  _genQuery: typeof genQuery;
  _genPagination: typeof genPagination;
  _genAllowedFields: typeof genAllowedFields;
  _genSelect: typeof genSelect;
  _pickAllowedFields: typeof pickAllowedFields;
  _genPopulate: typeof genPopulate;
  _genDocPermissions: typeof genDocPermissions;
  _validate: typeof validate;
  _prepare: typeof prepare;
  _transform: typeof transform;
  _permit: typeof permit;
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
    _genIDQuery: genIDQuery.bind(req),
    _genQuery: genQuery.bind(req),
    _genPagination: genPagination.bind(req),
    _genAllowedFields: genAllowedFields.bind(req),
    _genSelect: genSelect.bind(req),
    _pickAllowedFields: pickAllowedFields.bind(req),
    _genPopulate: genPopulate.bind(req),
    _genDocPermissions: genDocPermissions.bind(req),
    _validate: validate.bind(req),
    _prepare: prepare.bind(req),
    _transform: transform.bind(req),
    _permit: permit.bind(req),
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
