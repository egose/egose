import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import mapValues from 'lodash/mapValues';
import { FilterQuery } from 'mongoose';

export function replaceSubQuery<T>(filter: FilterQuery<T>) {
  if (!isPlainObject(filter)) return filter;

  const ret = mapValues(filter, (val, key) => {
    if (val.__op && val.__query) {
      return {
        $$sq: val.__query,
      };
    }

    if (isPlainObject(val)) {
      return replaceSubQuery(val);
    }

    if (isArray(val)) {
      return val.map((v) => replaceSubQuery(v));
    }

    return val;
  });

  return ret;
}
