import mongoose, { FilterQuery } from 'mongoose';
import { getModelRef, getModelAtt } from './meta';
import { Sort, Filter } from './interfaces';

interface FindProps {
  filter: Filter;
  select?: any;
  sort?: Sort;
  populate?: any;
  limit?: any;
  skip?: any;
  lean?: boolean;
}

interface FindOneProps {
  filter: Filter;
  select?: any;
  sort?: Sort;
  populate?: any;
  lean?: boolean;
}

// Reference
// const indexMap = Object.create(null);
// const reducer = (baseArr, index) => baseArr.concat(Object.keys(index.key));
// const concatKeys = async (name) => {
//   const indexes = await mongoose.model(name).collection.indexes()
//   indexMap[name] = indexes.reduce(reducer, []);
// };
// await Promise.all(mongoose.modelNames().map(concatKeys));

const reducer1 = (baseArr, index) => baseArr.concat(Object.keys(index.key));
const reducer2 = (baseObj, key) => ({ ...baseObj, [key]: true });

type SortValue = 1 | -1 | 'asc' | 'desc';
type SortType =
  | string
  | [string, SortValue][]
  | { [key: string]: SortValue }
  | Map<string, SortValue>
  | null
  | undefined;

class Model {
  modelName: string;
  model: mongoose.Model<any>;
  jsonSchema: Record<string, any>;
  indexKeys: string[];
  indexMap: any;
  modelAttrs: string[];

  constructor(modelName: string) {
    this.modelName = modelName;
    this.model = mongoose.model(modelName);
    if (!this.model) return;

    // Enable optimistic concurrency to ensure atomicity when
    // updating the document using find(), findOne(), and save().
    this.model.schema.set('optimisticConcurrency', true);
    // In order to use optimistic concurrency, a version key must be set on the schema.
    const currVersionKey = this.model.schema.get('versionKey');
    if (!currVersionKey) this.model.schema.set('versionKey', '__v');

    this.modelAttrs = getModelAtt(this.modelName);

    // this.model.collection.indexes({}, (err, result = []) => {
    //   this.indexKeys = result.reduce(reducer1, []);
    //   this.indexMap = this.indexKeys.reduce(reducer2, {});
    // });
  }

  new() {
    const doc = new this.model();
    return doc;
  }

  create(data) {
    return this.model.create(data);
  }

  find({ filter, select, sort, populate, limit, skip, lean }: FindProps) {
    // sort = this.pruneSort(sort);
    if (!this.validateSort(sort as SortType)) {
      sort = null;
    }

    let builder = this.model.find(filter as FilterQuery<any>);
    if (select) builder = builder.select(select);
    if (skip) builder = builder.skip(skip);
    if (limit) builder = builder.limit(limit);
    if (sort) builder = builder.sort(sort);
    if (populate) builder = builder.populate(populate);
    if (lean) builder = builder.lean();
    // builder = builder.setOptions({ sanitizeFilter: true });

    return builder;
  }

  // See https://github.com/Automattic/mongoose/blob/65b2d12a8f85f86136cfaf32947f338ba0c5f451/lib/query.js#L3011
  validateSort(sort: SortType, logError: (msg: string, ...args: any[]) => void = console.error): boolean {
    // Handle null/undefined (valid, no-op)
    if (sort === null || sort === undefined) return true;

    // Validate string
    if (typeof sort === 'string') {
      // Optional: Check for valid format (e.g., "field -field2")
      if (!/^[a-zA-Z0-9\s-]+/.test(sort)) {
        logError('Invalid sort string:', sort);
        return false;
      }
      return true;
    }

    // Validate array
    if (Array.isArray(sort)) {
      const isValid = sort.every((pair: any) => {
        if (!Array.isArray(pair) || pair.length !== 2) {
          logError('Invalid sort array element: must be [key, order]', pair);
          return false;
        }
        const [key, order] = pair as [string, any];
        if (typeof key !== 'string') {
          logError('Invalid sort array key: must be string', key);
          return false;
        }
        if (![1, -1, 'asc', 'desc'].includes(order)) {
          logError('Invalid sort array order: must be 1, -1, "asc", or "desc"', order);
          return false;
        }
        return true;
      });

      return isValid;
    }

    // Validate object
    if (typeof sort === 'object' && !(sort instanceof Map)) {
      const isValid = Object.values(sort).every((order: any) => {
        if (![1, -1, 'asc', 'desc'].includes(order)) {
          logError('Invalid sort object value: must be 1, -1, "asc", or "desc"', order);
          return false;
        }
        return true;
      });
      return isValid;
    }

    // Validate Map
    if (sort instanceof Map) {
      const isValid = Array.from(sort.values()).every((order: any) => {
        if (![1, -1, 'asc', 'desc'].includes(order)) {
          logError('Invalid sort Map value: must be 1, -1, "asc", or "desc"', order);
          return false;
        }
        return true;
      });
      return isValid;
    }

    // Invalid type
    logError('Invalid sort type: must be string, array, object, or Map', sort);
    return false;
  }

  pruneSort(sort = {}) {
    const ret = {};
    Object.keys(sort).forEach((key) => {
      if (this.indexMap[key]) {
        ret[key] = sort[key];
      } else {
        console.info(
          `Please consider creating an index for field "${key}" in collection "${this.modelName}" for better sorting`,
        );
        ret[key] = sort[key];
      }
    });

    return ret;
  }

  findOne({ filter, select, sort, populate, lean }: FindOneProps) {
    if (!this.validateSort(sort as SortType)) {
      sort = null;
    }

    let builder = this.model.findOne(filter as FilterQuery<any>);
    if (select) builder = builder.select(select);
    if (sort) builder = builder.sort(sort);
    if (populate) builder = builder.populate(populate);
    if (lean) builder = builder.lean();

    return builder;
  }

  findOneAndDelete(filter) {
    return this.model.findOneAndDelete(filter);
  }

  exists(filter) {
    if (!filter) return null;
    return this.findOne(filter).select('_id').lean();
  }

  // see https://mongoosejs.com/docs/api.html#query_Query-countDocuments
  countDocuments(filter = {}) {
    return this.model.countDocuments(filter);
  }

  // see https://mongoosejs.com/docs/api.html#model_Model.estimatedDocumentCount
  estimatedDocumentCount() {
    return this.model.estimatedDocumentCount();
  }

  // see https://mongoosejs.com/docs/api.html#model_Model.distinct
  distinct(field: string, conditions = {}) {
    return this.model.distinct(field, conditions);
  }
}

export default Model;
