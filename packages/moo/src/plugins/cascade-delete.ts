import mongoose, { FilterQuery, Schema } from 'mongoose';
import _isFunction from 'lodash/isFunction';
import sift from 'sift';
import { isPlainObject, isReference } from '../../../_common/utils/types';
import { parseSemver } from '../../../_common/utils/semver';
const semver = parseSemver(mongoose.version);
const deleteOneSupported = semver.major >= 7;

interface Options<T> {
  model: string;
  localField?: string;
  foreignField?: string;
  foreignFilter?: FilterQuery<T> | Function;
  extraForeignFilter?: FilterQuery<T> | Function;
}

export function cascadeDeletePlugin<T>(schema: Schema, options: Options<T>) {
  const { model, localField, foreignField, foreignFilter, extraForeignFilter } = options ?? {};

  const findDependents = async function ({ select, sort, populate, lean }) {
    const Target = mongoose.model(model);
    let query: FilterQuery<T> = null;

    if (foreignFilter) {
      query = _isFunction(foreignFilter) ? foreignFilter(this.toObject({ virtuals: false })) : foreignFilter;
    } else if (localField && foreignField) {
      const localValue = this.get(localField);
      let extraFilter = _isFunction(extraForeignFilter)
        ? extraForeignFilter(this.toObject({ virtuals: false }))
        : extraForeignFilter;

      if (!isPlainObject(extraFilter)) {
        extraFilter = {};
      }

      query = {
        [foreignField]: Array.isArray(localValue) ? { $in: localValue } : localValue,
        ...extraFilter,
      };
    }

    if (!query || !isPlainObject(query)) {
      console.error('[cascadeDeletePlugin: findDependents] invalid options');
      return;
    }

    let builder = Target.find(query);
    if (select) builder = builder.select(select);
    if (sort) builder = builder.sort(sort);
    if (populate) builder = builder.populate(populate);
    if (lean) builder = builder.lean();

    const documents = await builder;
    return documents;
  };

  const findOrphans = async function ({ select, sort, populate, lean }) {
    if (!localField || !foreignField) return null;

    const Target = mongoose.model(model);

    const schemaValue = Target.schema.obj[foreignField];
    if (!schemaValue) return null;

    const isMyRef = isReference(Target.schema.obj[foreignField], this.modelName);
    if (!isMyRef) return null;

    const ids = await this.distinct('_id');
    const query = {
      [foreignField]: { $not: { $in: ids } },
      ...(isPlainObject(extraForeignFilter) ? extraForeignFilter : {}),
    };

    let builder = Target.find(query);
    if (select) builder = builder.select(select);
    if (sort) builder = builder.sort(sort);
    if (populate) builder = builder.populate(populate);
    if (lean) builder = builder.lean();

    let documents = await builder;

    if (_isFunction(extraForeignFilter)) {
      documents = documents.filter(sift(extraForeignFilter()));
    }

    return documents;
  };

  if (deleteOneSupported) {
    schema.post('deleteOne', { document: true, query: false }, async function () {
      try {
        const documents = await findDependents.call(this, { select: '_id' });
        await Promise.all(documents.map((doc) => doc.deleteOne()));
      } catch (err) {
        console.error(err);
      }
    });
  } else {
    // @ts-ignore
    schema.post('remove', async function () {
      try {
        const documents = await findDependents.call(this, { select: '_id' });
        await Promise.all(documents.map((doc) => doc.remove()));
      } catch (err) {
        console.error(err);
      }
    });
  }

  const methodFnName = 'findDependents';
  const prevMethodFn = schema.methods[methodFnName];

  schema.method(methodFnName, async function methodFn(modelName?: string) {
    if (modelName) {
      if (modelName === model) {
        return findDependents.call(this, {});
      }

      return prevMethodFn.call(this, modelName);
    } else {
      const prev = prevMethodFn ? await prevMethodFn.call(this) : {};
      const results = {
        ...prev,
        [model]: await findDependents.call(this, {}),
      };
      return results;
    }
  });

  const staticFnName = 'findOrphans';
  const prevStaticFn = schema.statics[staticFnName];

  schema.static(staticFnName, async function methodFn(modelName?: string) {
    if (modelName) {
      if (modelName === model) {
        return findOrphans.call(this, {});
      }

      return null;
    } else {
      const prev = prevStaticFn ? await prevStaticFn.call(this) : {};
      const curr = await findOrphans.call(this, {});

      if (curr) {
        return { ...prev, [model]: curr };
      }

      return prev;
    }
  });
}
