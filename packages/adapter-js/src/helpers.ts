import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import mapValues from 'lodash/mapValues';

export function replaceSubQuery(filter: any) {
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

  console.log('retretret', ret);
  return ret;
}
