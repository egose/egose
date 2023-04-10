import compact from 'lodash/compact';
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
import Model from '../model';
import { setModelOptions, setModelOption, getModelOptions } from '../options';
import { normalizeSelect, iterateQuery, CustomError } from '../helpers';
import {
  ModelRouterOptions,
  MiddlewareContext,
  SubPopulate,
  DistinctArgs,
  Defaults,
  Populate,
  Request,
  FindArgs,
  FindOptions,
  FindOneArgs,
  FindOneOptions,
  FindByIdArgs,
  FindByIdOptions,
  CreateArgs,
  CreateOptions,
  UpdateOneArgs,
  UpdateOneOptions,
  UpdateByIdArgs,
  UpdateByIdOptions,
} from '../interfaces';
import { MIDDLEWARE, CORE, PERMISSIONS, PERMISSION_KEYS } from '../symbols';

export class Controller {
  req: Request;
  modelName: string;
  model: Model;
  options: ModelRouterOptions;
  defaults: Defaults;
  baseFields: string[];

  constructor(req: Request, modelName: string) {
    this.req = req;
    this.modelName = modelName;
    this.model = new Model(modelName);
    this.options = getModelOptions(modelName);
    this.defaults = this.options.defaults || {};
    this.baseFields = ['_id', this.options.permissionField];
  }

  protected async findOne(
    _filter: any,
    {
      select: _select = this.defaults.findOneArgs?.select,
      populate: _populate = this.defaults.findOneArgs?.populate,
      overrides = {},
    }: FindOneArgs = {},
    {
      includePermissions = this.defaults.findOneOptions?.includePermissions ?? true,
      access = this.defaults.findOneOptions?.access ?? 'read',
      populateAccess = this.defaults.findOneOptions?.populateAccess,
      lean = this.defaults.findOneOptions?.lean ?? false,
    }: FindOneOptions = {},
  ) {
    const { filter: __filter, select: __select, populate: __populate } = overrides;

    let [filter, select, populate] = await Promise.all([
      __filter || this.req[CORE]._genFilter(this.modelName, access, _filter),
      __select || this.req[CORE]._genSelect(this.modelName, access, _select),
      __populate || this.req[CORE]._genPopulate(this.modelName, populateAccess || access, _populate),
    ]);

    if (filter === false) return null;

    let doc = await this.model.findOne({ filter, select, populate, lean });
    if (!doc) return null;

    if (includePermissions) doc = await this.req[CORE]._permit(this.modelName, doc, access);
    return doc;
  }

  protected async findById(
    id,
    {
      select: _select = this.defaults.findByIdArgs?.select,
      populate: _populate = this.defaults.findByIdArgs?.populate,
      overrides = {},
    }: FindByIdArgs = {},
    {
      includePermissions = this.defaults.findOneOptions?.includePermissions ?? true,
      access = this.defaults.findOneOptions?.access ?? 'read',
      populateAccess = this.defaults.findOneOptions?.populateAccess,
      lean = this.defaults.findOneOptions?.lean ?? false,
    }: FindByIdOptions = {},
  ) {
    const { select: __select, populate: __populate, idFilter: __idFilter } = overrides;
    const filter = __idFilter || (await this.req[CORE]._genIDFilter(this.modelName, id));

    return this.findOne(
      filter,
      {
        select: _select,
        populate: _populate,
        overrides: {
          select: __select,
          populate: __populate,
        },
      },
      { includePermissions, access, populateAccess, lean },
    );
  }

  protected async find(
    _filter: any,
    {
      select: _select = this.defaults.findArgs?.select,
      populate: _populate = this.defaults.findArgs?.populate,
      sort = this.defaults.findArgs?.sort,
      limit = this.defaults.findArgs?.limit,
      page = this.defaults.findArgs?.page,
      overrides = {},
    }: FindArgs = {},
    {
      includePermissions = this.defaults.findOneOptions?.includePermissions ?? true,
      populateAccess = this.defaults.findOneOptions?.populateAccess ?? 'read',
      lean = this.defaults.findOneOptions?.lean ?? false,
    }: FindOptions = {},
    decorate?: Function,
  ) {
    const { filter: __filter, select: __select, populate: __populate } = overrides;

    let [filter, select, populate, pagination] = await Promise.all([
      __filter || this.req[CORE]._genFilter(this.modelName, 'list', this.operateQuery(_filter)),
      __select || this.req[CORE]._genSelect(this.modelName, 'list', _select),
      __populate || this.req[CORE]._genPopulate(this.modelName, populateAccess, _populate),
      this.req[CORE]._genPagination({ limit, page }, this.options.listHardLimit),
    ]);

    if (filter === false) return [];

    // prevent populate paths from updating filter select fields
    if (select) populate = (populate as Populate[]).filter((p) => (select as string[]).includes(p.path.split('.')[0]));

    let docs = await this.model.find({ filter, select, sort, populate, lean, ...pagination });
    docs = await Promise.all(
      docs.map(async (doc) => {
        if (includePermissions) doc = await this.req[CORE]._permit(this.modelName, doc, 'list');
        if (isFunction(decorate)) doc = await decorate(doc);
        return doc;
      }),
    );

    return docs;
  }

  protected async create(
    data,
    { populate = this.defaults.createArgs?.populate }: CreateArgs = {},
    {
      includePermissions = this.defaults.createOptions?.includePermissions ?? true,
      populateAccess = this.defaults.createOptions?.populateAccess ?? 'read',
    }: CreateOptions = {},
    decorate?: Function,
  ) {
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
        if (populate) await doc.populate(await this.req[CORE]._genPopulate(this.modelName, populateAccess, populate));
        if (isFunction(decorate)) doc = await decorate(doc, contexts[index]);
        return doc;
      }),
    );

    return isArr ? docs : docs[0];
  }

  protected async empty() {
    return this.model.new();
  }

  protected async updateOne(
    _filter: any,
    data,
    { populate = this.defaults.updateOneArgs?.populate, overrides = {} }: UpdateOneArgs = {},
    {
      includePermissions = this.defaults.updateOneOptions?.includePermissions ?? true,
      populateAccess = this.defaults.updateOneOptions?.populateAccess ?? 'read',
    }: UpdateOneOptions = {},
    decorate?: Function,
  ) {
    const { filter: __filter, populate: __populate } = overrides;

    const filter = __filter || (await this.req[CORE]._genFilter(this.modelName, 'update', _filter));
    if (filter === false) return null;

    let doc = await this.model.findOne({ filter });
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
    if (includePermissions) doc = await this.req[CORE]._permit(this.modelName, doc, 'update', context);
    if (populate) await doc.populate(await this.req[CORE]._genPopulate(this.modelName, populateAccess, populate));
    if (isFunction(decorate)) doc = await decorate(doc, context);
    return doc;
  }

  protected async updateById(
    id: string,
    data,
    { populate: _populate = this.defaults.updateByIdArgs?.populate, overrides = {} }: UpdateByIdArgs = {},
    {
      includePermissions = this.defaults.updateByIdOptions?.includePermissions ?? true,
      populateAccess = this.defaults.updateByIdOptions?.populateAccess ?? 'read',
    }: UpdateByIdOptions = {},
    decorate?: Function,
  ) {
    const { populate: __populate, idFilter: __idFilter } = overrides;
    const filter = __idFilter || (await this.req[CORE]._genIDFilter(this.modelName, id));

    return this.updateOne(
      filter,
      data,
      {
        populate: _populate,
        overrides: {
          populate: __populate,
        },
      },
      { includePermissions, populateAccess },
      decorate,
    );
  }

  protected async delete(id: string) {
    const filter = await this.req[CORE]._genFilter(
      this.modelName,
      'delete',
      await this.req[CORE]._genIDFilter(this.modelName, id),
    );
    if (filter === false) return null;

    let doc = await this.model.findOneAndRemove(filter);
    if (!doc) return null;

    await doc.remove();
    return doc._id;
  }

  protected async distinct(field: string, { filter }: DistinctArgs = {}) {
    filter = await this.req[CORE]._genFilter(this.modelName, 'read', filter);
    if (filter === false) return null;

    const result = await this.model.distinct(field, filter);
    if (!result) return null;

    return result;
  }

  protected async count(filter, access = 'list') {
    filter = await this.req[CORE]._genFilter(this.modelName, access, filter);
    if (filter === false) return 0;

    return this.model.countDocuments(filter);
  }

  private async operateQuery(filter) {
    const result = await iterateQuery(filter, async (sq, key) => {
      // @Deprecated option 'query'
      const { model, query, filter, mapper, ...rest } = sq;
      const ctl = this.req.macl(model);
      const arr = await ctl.find(filter ?? query, rest);
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
