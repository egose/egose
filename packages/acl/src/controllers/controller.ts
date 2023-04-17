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
    filter: any,
    {
      select = this.defaults.findOneArgs?.select,
      populate = this.defaults.findOneArgs?.populate,
      overrides = {},
    }: FindOneArgs = {},
    {
      includePermissions = this.defaults.findOneOptions?.includePermissions ?? true,
      access = this.defaults.findOneOptions?.access ?? 'read',
      populateAccess = this.defaults.findOneOptions?.populateAccess,
      lean = this.defaults.findOneOptions?.lean ?? false,
    }: FindOneOptions = {},
  ) {
    const { filter: overrideFilter, select: overrideSelect, populate: overridePopulate } = overrides;

    let [_filter, _select, _populate] = await Promise.all([
      overrideFilter || this.req[CORE]._genFilter(this.modelName, access, filter),
      overrideSelect || this.req[CORE]._genSelect(this.modelName, access, select),
      overridePopulate || this.req[CORE]._genPopulate(this.modelName, populateAccess || access, populate),
    ]);

    const info = {
      filter: _filter,
      select: _select,
      populate: _populate,
    };

    if (_filter === false) return { result: null, info };

    let doc = await this.model.findOne({ filter: _filter, select: _select, populate: _populate, lean });
    if (!doc) return { result: null, info };

    if (includePermissions) doc = await this.req[CORE]._permit(this.modelName, doc, access);
    return { result: doc, info };
  }

  protected async findById(
    id,
    {
      select = this.defaults.findByIdArgs?.select,
      populate = this.defaults.findByIdArgs?.populate,
      overrides = {},
    }: FindByIdArgs = {},
    {
      includePermissions = this.defaults.findOneOptions?.includePermissions ?? true,
      access = this.defaults.findOneOptions?.access ?? 'read',
      populateAccess = this.defaults.findOneOptions?.populateAccess,
      lean = this.defaults.findOneOptions?.lean ?? false,
    }: FindByIdOptions = {},
  ) {
    const { select: overrideSelect, populate: overridePopulate, idFilter: overrideIdFilter } = overrides;
    const filter = overrideIdFilter || (await this.req[CORE]._genIDFilter(this.modelName, id));

    return this.findOne(
      filter,
      {
        select,
        populate,
        overrides: {
          select: overrideSelect,
          populate: overridePopulate,
        },
      },
      { includePermissions, access, populateAccess, lean },
    );
  }

  protected async find(
    filter: any,
    {
      select = this.defaults.findArgs?.select,
      populate = this.defaults.findArgs?.populate,
      sort = this.defaults.findArgs?.sort,
      limit = this.defaults.findArgs?.limit,
      page = this.defaults.findArgs?.page,
      overrides = {},
    }: FindArgs = {},
    {
      includePermissions = this.defaults.findOptions?.includePermissions ?? true,
      includeCount = this.defaults.findOptions?.includeCount ?? false,
      populateAccess = this.defaults.findOptions?.populateAccess ?? 'read',
      lean = this.defaults.findOptions?.lean ?? false,
    }: FindOptions = {},
    decorate?: Function,
  ) {
    const { filter: overrideFilter, select: overrideSelect, populate: overridePopulate } = overrides;

    const [_filter, _select, _populate, pagination] = await Promise.all([
      overrideFilter || this.req[CORE]._genFilter(this.modelName, 'list', this.operateQuery(filter)),
      overrideSelect || this.req[CORE]._genSelect(this.modelName, 'list', select),
      overridePopulate || this.req[CORE]._genPopulate(this.modelName, populateAccess, populate),
      this.req[CORE]._genPagination({ limit, page }, this.options.listHardLimit),
    ]);

    const info = { filter: _filter, select: _select, populate: _populate, pagination };

    if (_filter === false) return { result: [], count: 0, totalCount: null, info };

    // filter populated fields based on select fields
    const filteredPopulate =
      Array.isArray(_select) && Array.isArray(_populate)
        ? _populate.filter((p) => _select.includes(p.path.split('.')[0]))
        : _populate;

    let docs = await this.model.find({
      filter: _filter,
      select: _select,
      populate: filteredPopulate,
      sort,
      lean,
      ...pagination,
    });

    const _decorate = isFunction(decorate) ? decorate : (v) => v;

    docs = await Promise.all(
      docs.map(async (doc) => {
        if (includePermissions) doc = await this.req[CORE]._permit(this.modelName, doc, 'list');
        doc = await _decorate(doc);
        return doc;
      }),
    );

    return {
      result: docs,
      count: docs.length,
      totalCount: includeCount ? await this.model.countDocuments(_filter) : null,
      info,
    };
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

    return {
      result: docs,
      data: items,
      count: docs.length,
    };
  }

  protected async empty() {
    return this.model.new();
  }

  protected async updateOne(
    filter: any,
    data,
    { populate = this.defaults.updateOneArgs?.populate, overrides = {} }: UpdateOneArgs = {},
    {
      includePermissions = this.defaults.updateOneOptions?.includePermissions ?? true,
      populateAccess = this.defaults.updateOneOptions?.populateAccess ?? 'read',
    }: UpdateOneOptions = {},
    decorate?: Function,
  ) {
    const { filter: overrideFilter, populate: overridePopulate } = overrides;

    const [_filter, _populate] = await Promise.all([
      overrideFilter || this.req[CORE]._genFilter(this.modelName, 'update', filter),
      overridePopulate || this.req[CORE]._genPopulate(this.modelName, populateAccess, populate),
    ]);

    if (_filter === false) return { result: null, data: null };

    let doc = await this.model.findOne({ filter: _filter });
    if (!doc) return { result: null, data: null };

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
    if (_populate) await doc.populate(_populate);
    if (isFunction(decorate)) doc = await decorate(doc, context);
    return { result: doc, data: prepared };
  }

  protected async updateById(
    id: string,
    data,
    { populate = this.defaults.updateByIdArgs?.populate, overrides = {} }: UpdateByIdArgs = {},
    {
      includePermissions = this.defaults.updateByIdOptions?.includePermissions ?? true,
      populateAccess = this.defaults.updateByIdOptions?.populateAccess ?? 'read',
    }: UpdateByIdOptions = {},
    decorate?: Function,
  ) {
    const { populate: overridePopulate, idFilter: overrideIdFilter } = overrides;
    const filter = overrideIdFilter || (await this.req[CORE]._genIDFilter(this.modelName, id));

    return this.updateOne(
      filter,
      data,
      {
        populate,
        overrides: {
          populate: overridePopulate,
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

    const info = { filter };

    if (filter === false) return { result: null, info };

    let doc = await this.model.findOneAndRemove(filter);
    if (!doc) return { result: null, info };

    await doc.remove();
    return { result: doc._id, info };
  }

  protected async distinct(field: string, { filter }: DistinctArgs = {}) {
    filter = await this.req[CORE]._genFilter(this.modelName, 'read', filter);

    const info = { filter };

    if (filter === false) return { result: null, info };

    const result = await this.model.distinct(field, filter);
    if (!result) return { result: null, info };

    return { result, info };
  }

  protected async count(filter, access = 'list') {
    filter = await this.req[CORE]._genFilter(this.modelName, access, filter);

    const info = { filter };

    if (filter === false) return { result: 0, info };

    return { result: await this.model.countDocuments(filter), info };
  }

  private async operateQuery(filter) {
    const result = await iterateQuery(filter, async (sq, key) => {
      // @Deprecated option 'query'
      const { model, query, filter, mapper, ...rest } = sq;
      const ctl = this.req.macl(model);
      const { result, count } = await ctl.find(filter ?? query, rest);
      if (mapper && count > 0) {
        const m = mapper.multi === false ? false : true;
        const c = mapper.compact === true;
        const f = mapper.flatten === true;
        const path = mapper.path || mapper;
        if (!m) return get(result[0], path, isNil(mapper.defaultValue) ? null : mapper.defaultValue);

        let items = result.map((v) => get(v, path));
        if (f) items = flatten(items);
        if (c) items = compact(items);
        return items;
      }
      return result;
    });

    return result;
  }
}
