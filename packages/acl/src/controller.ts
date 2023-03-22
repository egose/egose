import compact from 'lodash/compact';
import filter from 'lodash/filter';
import flatten from 'lodash/flatten';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import isMatch from 'lodash/isMatch';
import isNil from 'lodash/isNil';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import pick from 'lodash/pick';
import Model from './model';
import { setModelOptions, setModelOption, getModelOptions } from './options';
import { normalizeSelect, iterateQuery, CustomError } from './helpers';
import {
  ModelRouterOptions,
  MiddlewareContext,
  SubPopulate,
  ListProps,
  ReadProps,
  CreateOptions,
  UpdateOptions,
  DistinctOptions,
  Defaults,
  Populate,
  FindOneOptions,
  FindProps,
  FindOneProps,
  FindByIdProps,
  Request,
} from './interfaces';
import { MIDDLEWARE, CORE, PERMISSIONS, PERMISSION_KEYS } from './symbols';

class Controller {
  req: Request;
  modelName: string;
  model: Model;
  options: ModelRouterOptions;
  defaults: Defaults;

  constructor(req: Request, modelName: string) {
    this.req = req;
    this.modelName = modelName;
    this.model = new Model(modelName);
    this.options = getModelOptions(modelName);
    this.defaults = this.options.defaults || {};
  }

  protected async findOne({
    query: _query = {},
    select: _select = this.defaults.findOne?.select,
    populate: _populate = this.defaults.findOne?.populate,
    options = this.defaults.findOne?.options || {},
    overrides = {},
  }: FindOneProps = {}) {
    const { includePermissions = true, access = 'read', populateAccess, lean = false } = options;
    const { query: __query, select: __select, populate: __populate } = overrides;

    let [query, select, populate] = await Promise.all([
      __query || this.req[CORE]._genQuery(this.modelName, access, _query),
      __select || this.req[CORE]._genSelect(this.modelName, access, _select),
      __populate || this.req[CORE]._genPopulate(this.modelName, populateAccess || access, _populate),
    ]);

    if (query === false) return null;

    let doc = await this.model.findOne({ query, select, populate, lean });
    if (!doc) return null;

    if (includePermissions) doc = await this.req[CORE]._permit(this.modelName, doc, access);
    return doc;
  }

  protected async findById(
    id,
    {
      select: _select = this.defaults.findById?.select,
      populate: _populate = this.defaults.findById?.populate,
      options = this.defaults.findById?.options || {},
      overrides = {},
    }: FindByIdProps = {},
  ) {
    const { select: __select, populate: __populate, idQuery: __idQuery } = overrides;
    const query = __idQuery || (await this.req[CORE]._genIDQuery(this.modelName, id));

    return this.findOne({
      query,
      select: _select,
      populate: _populate,
      options,
      overrides: {
        select: __select,
        populate: __populate,
      },
    });
  }

  protected async find({
    query: _query = {},
    select: _select = this.defaults.find?.select,
    populate: _populate = this.defaults.find?.populate,
    sort = this.defaults.find?.sort,
    limit = this.defaults.find?.limit,
    page = this.defaults.find?.page,
    options = this.defaults.find?.options || {},
    overrides = {},
    decorate,
  }: FindProps = {}) {
    const { includePermissions = true, populateAccess = 'read', lean = false } = options;
    const { query: __query, select: __select, populate: __populate } = overrides;

    let [query, select, populate, pagination] = await Promise.all([
      __query || this.req[CORE]._genQuery(this.modelName, 'list', this.operateQuery(_query)),
      __select || this.req[CORE]._genSelect(this.modelName, 'list', _select),
      __populate || this.req[CORE]._genPopulate(this.modelName, populateAccess, _populate),
      this.req[CORE]._genPagination({ limit, page }, this.options.listHardLimit),
    ]);

    if (query === false) return [];

    // prevent populate paths from updating query select fields
    if (select) populate = (populate as Populate[]).filter((p) => (select as string[]).includes(p.path.split('.')[0]));

    let docs = await this.model.find({ query, select, sort, populate, lean, ...pagination });
    docs = await Promise.all(
      docs.map(async (doc) => {
        if (includePermissions) doc = await this.req[CORE]._permit(this.modelName, doc, 'list');
        if (isFunction(decorate)) doc = await decorate(doc);
        return doc;
      }),
    );

    return docs;
  }

  protected async create(data, options: CreateOptions = this.defaults.create || {}, decorate?: Function) {
    const { includePermissions = true } = options;

    const isArr = Array.isArray(data);
    let arr = isArr ? data : [data];

    const contexts: MiddlewareContext[] = [];

    const items = await Promise.all(
      arr.map(async (item) => {
        const context: MiddlewareContext = { originalData: item };

        const allowedFields = await this.req[CORE]._genAllowedFields(this.modelName, item, 'create');
        const allowedData = pick(item, allowedFields);

        const validated = await this.req[CORE]._validate(this.modelName, allowedData, 'create', context);
        if (isBoolean(validated)) {
          if (!validated) throw new CustomError({ statusCode: 400, message: 'validation failed' });
        } else if (isArray(validated)) {
          if (validated.length > 0)
            throw new CustomError({ statusCode: 400, message: 'validation failed', errors: validated });
        }

        const preparedData = await this.req[CORE]._prepare(this.modelName, allowedData, 'create', context);

        context.preparedData = preparedData;
        contexts.push(context);
        return preparedData;
      }),
    );

    let docs = await this.model.create(items);
    docs = await Promise.all(
      docs.map(async (doc, index) => {
        if (includePermissions) doc = await this.req[CORE]._permit(this.modelName, doc, 'create', contexts[index]);
        if (isFunction(decorate)) doc = await decorate(doc, contexts[index]);
        return doc;
      }),
    );

    return isArr ? docs : docs[0];
  }

  protected async empty() {
    return this.model.new();
  }

  protected async update(id: string, data, decorate?: Function) {
    const query = await this.req[CORE]._genQuery(
      this.modelName,
      'update',
      await this.req[CORE]._genIDQuery(this.modelName, id),
    );
    if (query === false) return null;

    let doc = await this.model.findOne({ query });
    if (!doc) return null;

    const context: MiddlewareContext = {};

    context.originalDoc = doc.toObject();
    context.originalData = data;

    doc = await this.req[CORE]._permit(this.modelName, doc, 'update', context);

    context.currentDoc = doc;
    const allowedFields = await this.req[CORE]._genAllowedFields(this.modelName, doc, 'update');
    const allowedData = pick(data, allowedFields);

    const validated = await this.req[CORE]._validate(this.modelName, allowedData, 'update', context);
    if (isBoolean(validated)) {
      if (!validated) throw new CustomError({ statusCode: 400, message: 'validation failed' });
    } else if (isArray(validated)) {
      if (validated.length > 0)
        throw new CustomError({ statusCode: 400, message: 'validation failed', errors: validated });
    }

    const prepared = await this.req[CORE]._prepare(this.modelName, allowedData, 'update', context);

    context.preparedData = prepared;
    Object.assign(doc, prepared);

    context.modifiedPaths = doc.modifiedPaths();
    doc = await this.req[CORE]._transform(this.modelName, doc, 'update', context);
    context.modifiedPaths = doc.modifiedPaths();
    doc = await doc.save();
    doc = await this.req[CORE]._permit(this.modelName, doc, 'update', context);

    if (isFunction(decorate)) doc = await decorate(doc, context);
    return doc;
  }

  protected async delete(id: string) {
    const query = await this.req[CORE]._genQuery(
      this.modelName,
      'delete',
      await this.req[CORE]._genIDQuery(this.modelName, id),
    );
    if (query === false) return null;

    let doc = await this.model.findOneAndRemove(query);
    if (!doc) return null;

    await doc.remove();
    return doc._id;
  }

  protected async distinct(field: string, options: DistinctOptions = this.defaults.distinct || {}) {
    let { query } = options;

    query = await this.req[CORE]._genQuery(this.modelName, 'read', query);
    if (query === false) return null;

    const result = await this.model.distinct(field, query);
    if (!result) return null;

    return result;
  }

  protected async count(query, access = 'list') {
    query = await this.req[CORE]._genQuery(this.modelName, access, query);
    if (query === false) return 0;

    return this.model.countDocuments(query);
  }

  private async operateQuery(query) {
    const result = await iterateQuery(query, async (sq, key) => {
      const { model, mapper, ...rest } = sq;
      const ctl = this.req.macl(model);
      const arr = await ctl.find(rest);
      if (mapper) {
        const m = mapper.multi === false ? false : true;
        const c = mapper.compact === true;
        const f = mapper.flatten === true;
        const path = mapper.path || mapper;
        if (!m) return get(arr[0], path, isNil(mapper.defaultValue) ? null : mapper.defaultValue);

        let items = arr.map((v) => get(v, path));
        if (f) items = flatten(items);
        if (c) items = compact(items);
        return items;
      }
      return arr;
    });

    return result;
  }
}

export default Controller;
