import mongoose from 'mongoose';

interface FindProps {
  filter: any;
  select?: any;
  sort?: any;
  populate?: any;
  limit?: any;
  skip?: any;
  lean?: boolean;
}

interface FindOneProps {
  filter: any;
  select?: any;
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

class Model {
  modelName: string;
  model: mongoose.Model<any>;
  jsonSchema: Record<string, any>;
  indexKeys: string[];
  indexMap: any;

  constructor(modelName: string) {
    this.modelName = modelName;
    this.model = mongoose.model(modelName);
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

    let builder = this.model.find(filter);
    if (select) builder = builder.select(select);
    if (skip) builder = builder.skip(skip);
    if (limit) builder = builder.limit(limit);
    if (sort) builder = builder.sort(sort);
    if (populate) builder = builder.populate(populate);
    if (lean) builder = builder.lean();
    // builder = builder.setOptions({ sanitizeFilter: true });

    return builder;
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

  findOne({ filter, select, populate, lean }: FindOneProps) {
    let builder = this.model.findOne(filter);
    if (select) builder = builder.select(select);
    if (populate) builder = builder.populate(populate);
    if (lean) builder = builder.lean();

    return builder;
  }

  findOneAndDelete(filter) {
    return this.model.findOneAndDelete(filter);
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
