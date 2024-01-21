import mongoose, { FilterQuery, Schema } from 'mongoose';
import { isFunction, isPlainObject } from '../../../_common/utils/types';
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

  const findDependencies = async function ({ select, sort, populate, lean }) {
    const Target = mongoose.model(model);
    let query: FilterQuery<T> = null;

    if (foreignFilter) {
      query = isFunction(foreignFilter)
        ? (foreignFilter as Function)(this.toObject({ virtuals: false }))
        : foreignFilter;
    } else if (localField && foreignField) {
      const localValue = this.get(localField);
      let extraFilter = isFunction(extraForeignFilter)
        ? (extraForeignFilter as Function)(this.toObject({ virtuals: false }))
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
      console.error('[cascadeDeletePlugin] invalid options');
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

  if (deleteOneSupported) {
    schema.post('deleteOne', { document: true, query: false }, async function () {
      try {
        const documents = await findDependencies.call(this, { select: '_id' });
        await Promise.all(documents.map((doc) => doc.deleteOne()));
      } catch (err) {
        console.error(err);
      }
    });
  } else {
    // @ts-ignore
    schema.post('remove', async function () {
      try {
        const documents = await findDependencies.call(this, { select: '_id' });
        await Promise.all(documents.map((doc) => doc.remove()));
      } catch (err) {
        console.error(err);
      }
    });
  }

  const fnName = 'findDependents';
  const prevFn = schema.methods[fnName];

  schema.method(fnName, async function methodFn() {
    const prev = prevFn ? await prevFn.call(this) : {};
    const results = {
      ...prev,
      [model]: await findDependencies.call(this, {}),
    };
    return results;
  });
}
