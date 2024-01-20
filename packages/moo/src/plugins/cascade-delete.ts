import mongoose, { FilterQuery } from 'mongoose';
import { isFunction, isPlainObject } from '../../../_common/utils/types';

interface Options<T> {
  model: string;
  localField?: string;
  foreignField?: string;
  foreignFilter?: FilterQuery<T> | Function;
  extraForeignFilter?: FilterQuery<T> | Function;
}

export function cascadeDeletePlugin<T>(schema, options: Options<T>) {
  const { model, localField, foreignField, foreignFilter, extraForeignFilter } = options ?? {};

  schema.post('deleteOne', { document: true, query: false }, async function () {
    const Target = mongoose.model(model);

    try {
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

      const documents = await Target.find(query);
      await Promise.all(documents.map((doc) => doc.deleteOne()));
    } catch (err) {
      console.error(err);
    }
  });
}
