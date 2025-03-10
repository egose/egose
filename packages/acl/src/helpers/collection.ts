import { Schema } from 'mongoose';
import sift from 'sift';
import filter from 'lodash/filter';
import find from 'lodash/find';
import isMatch from 'lodash/isMatch';

export const filterCollection = (collection, predicate) => {
  return filter(collection, sift(predicate));
};

export const findElement = (collection, predicate) => {
  return find(collection, sift(predicate));
};

export const matchElement = (element, predicate) => {
  return isMatch(element, sift(predicate));
};

type DocId = string | Schema.Types.ObjectId;

export const findElementById = (collection, id: DocId) => {
  return findElement(collection, { _id: id });
};
