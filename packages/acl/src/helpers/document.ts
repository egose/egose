import { Document } from 'mongoose';
import isPlainObject from 'lodash/isPlainObject';
import set from 'lodash/set';
import pick from 'lodash/pick';
import { isDocument, isPromise } from '../lib';
import { getModelOption } from '../options';

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
