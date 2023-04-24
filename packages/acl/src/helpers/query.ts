import isNaN from 'lodash/isNaN';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isNil from 'lodash/isNil';
import flattenDeep from 'lodash/flattenDeep';
import reduce from 'lodash/reduce';
import { Projection, KeyValueProjection } from '../interfaces';

export function genPagination(
  {
    skip,
    limit,
    page,
    pageSize,
  }: {
    skip?: number | string;
    limit?: number | string;
    page?: number | string;
    pageSize?: number | string;
  },
  hardLimit,
) {
  let _skip = 0;
  let _limit = Number(limit ?? pageSize);
  if (isNaN(_limit) || _limit > hardLimit) _limit = hardLimit;

  if (!isNil(skip)) {
    _skip = Number(skip);
  } else if (!isNil(page)) {
    const npage = Number(page);
    if (npage > 1) _skip = (npage - 1) * _limit;
  }

  return { skip: _skip, limit: _limit };
}

export const normalizeSelect = function normalizeSelect(select: Projection): string[] {
  if (Array.isArray(select)) return flattenDeep(select.map(normalizeSelect));
  if (isPlainObject(select)) {
    return reduce(
      select as KeyValueProjection,
      (ret, val, key) => {
        if (val === 1) ret.push(key);
        else if (val === -1) ret.push(`-${key}`);
        return ret;
      },
      [],
    );
  }
  if (isString(select)) return select.split(' ').map((v) => v.trim());
  return [];
};
