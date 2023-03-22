import castArray from 'lodash/castArray';
import cloneDeep from 'lodash/cloneDeep';
import forEach from 'lodash/forEach';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import map from 'lodash/map';
import set from 'lodash/set';

interface ProcessCopy {
  src: string;
  dest: string;
}

interface CopyAndDepopulateOptions {
  mutable?: boolean;
  idField?: string;
}

export const copyAndDepopulate = (
  docObject: any,
  operations: ProcessCopy[],
  options: CopyAndDepopulateOptions = { mutable: true, idField: '_id' },
) => {
  const obj = get(options, 'mutable', true) ? docObject : cloneDeep(docObject);
  const idField = get(options, 'idField', '_id');

  forEach(castArray<ProcessCopy>(operations), (op) => {
    if (!op.src || !op.dest) return;

    let targets = [obj];
    const segs = op.src.split('.');
    forEach<string>(segs, (seg, ind) => {
      if (segs.length === ind + 1) {
        forEach(targets, (target) => {
          set(target, op.dest, get(target, seg));
          set(target, seg, isArray(target[seg]) ? map(target[seg], idField) : get(target, `${seg}.${idField}`));
        });
      } else {
        targets = targets.reduce((ret, target) => {
          if (isArray(target[seg])) ret.push(...target[seg]);
          else ret.push(target[seg]);

          return ret;
        }, []);
      }
    });
  });

  return obj;
};
