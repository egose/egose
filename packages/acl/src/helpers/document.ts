import isPlainObject from 'lodash/isPlainObject';
import set from 'lodash/set';
import { isDocument } from '../lib';
import { getModelOption } from '../options';

export function getDocPermissions(modelName, doc) {
  const docPermissionField = getModelOption(modelName, 'permissionField');
  let docPermissions = {};
  if (isDocument(doc)) {
    docPermissions = (doc._doc && doc._doc[docPermissionField]) || {};
  } else if (isPlainObject(doc)) {
    docPermissions = doc[docPermissionField] || {};
  }

  return docPermissions;
}

export function setDocPermissions(doc, path, value) {
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
