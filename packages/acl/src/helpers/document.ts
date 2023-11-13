import { Document, Schema } from 'mongoose';
import isPlainObject from 'lodash/isPlainObject';
import set from 'lodash/set';
import pick from 'lodash/pick';
import keys from 'lodash/keys';
import isArray from 'lodash/isArray';
import filter from 'lodash/filter';
import find from 'lodash/find';
import isMatch from 'lodash/isMatch';
import isString from 'lodash/isString';
import { isDocument, isPromise } from '../lib';
import { getModelOption } from '../options';
import { SubPopulate } from '../interfaces';
import { normalizeSelect } from './query';

export function getDocValue(modelName, doc) {
  const docPermissionField = getModelOption(modelName, 'permissionField');
  let docPermissions = {};
  if (isDocument(doc)) {
    docPermissions = (doc._doc && doc._doc[docPermissionField]) || {};
  } else if (isPlainObject(doc)) {
    docPermissions = doc[docPermissionField] || {};
  }

  return docPermissions;
}

export function setDocValue(doc, path, value) {
  if (isDocument(doc)) {
    set(doc._doc, path, value);
  } else if (isPlainObject(doc)) {
    set(doc, path, value);
  }
}

export function getModelKeys(doc) {
  return Object.keys(isDocument(doc) ? doc._doc : doc);
}

export function toObject(doc) {
  return isDocument(doc) ? doc.toObject() : doc;
}

export function pickDocFields(doc, fields = []) {
  if (isDocument(doc)) {
    doc._doc = pick(doc._doc, fields);
    return doc;
  } else {
    return pick(doc, fields);
  }
}

export async function populateDoc(doc: Document, target) {
  let p = doc.populate(target);
  if (isPromise(p)) return p;

  // for backward compatibility, utilize the 'execPopulate' method to populate the target fields.
  return 'execPopulate' in p && (p as any).execPopulate();
}

export const filterCollection = (collection, predicate) => {
  if (isPlainObject(predicate))
    return predicate.$and
      ? filter(collection, (element) => predicate.$and.every((pre) => isMatch(pick(element, keys(pre)), pre)))
      : filter(collection, predicate);

  return [];
};

export const findElement = (collection, predicate) => {
  if (isPlainObject(predicate))
    return predicate.$and
      ? find(collection, (value) => predicate.$and.every((pre) => isMatch(pick(value, keys(pre)), pre)))
      : find(collection, predicate);

  return null;
};

type DocId = string | Schema.Types.ObjectId;

export const findById = (docs: { _id: DocId }[], id: DocId) => {
  return docs.find(({ _id }) => String(_id) === String(id));
};

export const genSubPopulate = (sub: string, popul: any) => {
  if (!popul) return [];

  let populate = isArray(popul) ? popul : [popul];
  populate = populate.map((p: SubPopulate | string) => {
    const ret: SubPopulate = isString(p)
      ? { path: `${sub}.${p}` }
      : {
          path: `${sub}.${p.path}`,
          select: normalizeSelect(p.select),
        };

    return ret;
  });

  return populate;
};
