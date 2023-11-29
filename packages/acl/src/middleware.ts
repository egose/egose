import { Response, NextFunction } from 'express';
import JsonRouter from 'express-json-router';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import { setCore } from './core';
import Permission from './permission';
import { Request } from './interfaces';
import { createValidator, getDocPermissions } from './helpers';
import { getGlobalOption, getModelOption } from './options';
import { MIDDLEWARE, PERMISSIONS, PERMISSION_KEYS } from './symbols';

export default function macl() {
  return async function (req: Request, res: Response, next: NextFunction) {
    await setCore(req, res, next);
  };
}

export interface GuardModelConditionID {
  type: string;
  key: string;
}

export interface GuardModelCondition {
  modelName: string;
  id: string | GuardModelConditionID;
  condition: string | string[];
}

export function guard(condition: string);
export function guard(conditions: string[]);
export function guard(conditionFunc: Function);
export function guard(modelCondition: GuardModelCondition);

export function guard(condition: unknown) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const permissions = req[PERMISSIONS] as Permission;
    let cond = condition;
    let phas = (key) => permissions.has(key);

    if (isPlainObject(condition)) {
      const { modelName, id, condition: _cond } = condition as GuardModelCondition;
      const svc = req.macl.getPublicService(modelName);
      const select = getModelOption(modelName, `mandatoryFields.read`, undefined);

      let _id = id;
      if (isPlainObject(id)) {
        const { type = 'param', key } = id as GuardModelConditionID;
        if (type === 'param') {
          _id = req.params[key];
        } else if (type === 'query') {
          const _qval = req.query[key];
          if (isArray(_qval)) _id = _qval.length > 0 ? (_qval[0] as string) : null;
          else _id = _qval as string;
        } else {
          _id = null;
        }
      }

      if (!isString(_id) || !_id) {
        return next(new JsonRouter.clientErrors.BadRequestError());
      }

      const result = await svc._read(_id, { select });
      if (!result.success) {
        return next(new JsonRouter.clientErrors.UnauthorizedError());
      }

      const docPermissions = getDocPermissions(modelName, result.data);
      phas = (key) => permissions.has(key) || docPermissions[key];
      cond = _cond;
    }

    const { stringHandler, arrayHandler } = createValidator(phas);
    if (isString(cond)) {
      if (stringHandler(cond)) return next();
    } else if (isArray(cond)) {
      if (arrayHandler(cond)) return next();
    } else if (isFunction(cond)) {
      const result = await cond.call(req, permissions);
      if (!!result) return next();
    }

    next(new JsonRouter.clientErrors.UnauthorizedError());
  };
}
