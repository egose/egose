import compact from 'lodash/compact';
import flatten from 'lodash/flatten';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import pick from 'lodash/pick';
import Model from '../model';
import { getModelOption, getModelOptions } from '../options';
import { iterateQuery, CustomError, getDocPermissions, genPagination, populateDoc } from '../helpers';
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
  BaseFilterAccess,
  ExistsOptions,
  ServiceResult,
  SubQueryEntry,
} from '../interfaces';
import { Codes, StatusCodes } from '../enums';
import { Base } from './base';

const ALLOWED_ROUTES = ['list', 'read'];

export class Service extends Base {
  model: Model;
  options: ModelRouterOptions;
  defaults: Defaults;
  baseFields: string[];
  baseFieldsExt: string[];

  constructor(req: Request, modelName: string) {
    super(req, modelName);

    this.model = new Model(modelName);
    this.options = getModelOptions(modelName);
    this.defaults = this.options.defaults || {};
    this.baseFields = ['_id'];
    this.baseFieldsExt = this.baseFields.concat(this.options.permissionField);
  }

  public async findOne(
    filter: any,
    {
      select = this.defaults.findOneArgs?.select,
      populate = this.defaults.findOneArgs?.populate,
      overrides = {},
    }: FindOneArgs = {},
    {
      skim = this.defaults.findOneOptions?.skim ?? false,
      includePermissions = this.defaults.findOneOptions?.includePermissions ?? true,
      access = this.defaults.findOneOptions?.access ?? 'read',
      populateAccess = this.defaults.findOneOptions?.populateAccess,
      lean = this.defaults.findOneOptions?.lean ?? false,
    }: FindOneOptions = {},
  ): Promise<ServiceResult> {
    const { filter: overrideFilter, select: overrideSelect, populate: overridePopulate } = overrides;

    let [_filter, _select, _populate] = await Promise.all([
      overrideFilter || this.genFilter(access, filter),
      overrideSelect || this.genSelect(access, select),
      overridePopulate || this.genPopulate(populateAccess || access, populate),
    ]);

    const query = {
      filter: _filter,
      select: _select,
      populate: _populate,
    };

    if (_filter === false) return { success: false, code: Codes.Forbidden, data: null, query };

    let doc = await this.model.findOne({ filter: _filter, select: _select, populate: _populate, lean });
    if (!doc) return { success: false, code: Codes.NotFound, data: null, query };

    let includeDocPermissions = includePermissions;
    if (!includeDocPermissions && !skim) {
      includeDocPermissions = this.checkIfModelPermissionExists([access, 'read', 'update']);
    }
    if (includeDocPermissions) doc = await this.addDocPermissions(doc, access);
    if (includePermissions) doc = await this.addFieldPermissions(doc, access);
    doc = await this.pickAllowedFields(doc, access, includePermissions ? this.baseFieldsExt : this.baseFields);

    return { success: true, code: Codes.Success, data: doc, query };
  }

  public async findById(
    id: string,
    {
      select = this.defaults.findByIdArgs?.select,
      populate = this.defaults.findByIdArgs?.populate,
      overrides = {},
    }: FindByIdArgs = {},
    {
      skim = this.defaults.findOneOptions?.skim ?? false,
      includePermissions = this.defaults.findOneOptions?.includePermissions ?? true,
      access = this.defaults.findOneOptions?.access ?? 'read',
      populateAccess = this.defaults.findOneOptions?.populateAccess,
      lean = this.defaults.findOneOptions?.lean ?? false,
    }: FindByIdOptions = {},
  ): Promise<ServiceResult> {
    const { select: overrideSelect, populate: overridePopulate, idFilter: overrideIdFilter } = overrides;
    const filter = overrideIdFilter || (await this.genIDFilter(id));

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
      { skim, includePermissions, access, populateAccess, lean },
    );
  }

  public async find(
    filter: any,
    {
      select = this.defaults.findArgs?.select,
      populate = this.defaults.findArgs?.populate,
      sort = this.defaults.findArgs?.sort,
      skip = this.defaults.findArgs?.skip,
      limit = this.defaults.findArgs?.limit,
      page = this.defaults.findArgs?.page,
      pageSize = this.defaults.findArgs?.pageSize,
      overrides = {},
    }: FindArgs = {},
    {
      skim = this.defaults.findOptions?.skim ?? false,
      includePermissions = this.defaults.findOptions?.includePermissions ?? true,
      includeCount = this.defaults.findOptions?.includeCount ?? false,
      populateAccess = this.defaults.findOptions?.populateAccess ?? 'read',
      lean = this.defaults.findOptions?.lean ?? false,
    }: FindOptions = {},
    decorate?: Function,
  ): Promise<ServiceResult> {
    const { filter: overrideFilter, select: overrideSelect, populate: overridePopulate } = overrides;

    const [_filter, _select, _populate, pagination] = await Promise.all([
      overrideFilter || this.genFilter('list', await this.operateQuery(filter)),
      overrideSelect || this.genSelect('list', select),
      overridePopulate || this.genPopulate(populateAccess, populate),
      genPagination({ skip, limit, page, pageSize }, this.options.listHardLimit),
    ]);

    // filter populated fields based on select fields
    const filteredPopulate =
      Array.isArray(_select) && Array.isArray(_populate)
        ? _populate.filter((p) => _select.includes(p.path.split('.')[0]))
        : _populate;

    const query = { filter: _filter, select: _select, populate: filteredPopulate, sort, ...pagination };

    if (_filter === false) return { success: false, code: 'forbidden', data: [], count: 0, totalCount: null, query };

    let docs = await this.model.find({
      ...query,
      lean,
    });

    const _decorate = isFunction(decorate) ? decorate : (v) => v;

    docs = await Promise.all(
      docs.map(async (doc) => {
        let includeDocPermissions = includePermissions;
        if (!includeDocPermissions && !skim) {
          includeDocPermissions = this.checkIfModelPermissionExists(['list', 'read', 'update']);
        }
        if (includeDocPermissions) doc = await this.addDocPermissions(doc, 'list');
        if (includePermissions) doc = await this.addFieldPermissions(doc, 'list');
        doc = await this.pickAllowedFields(doc, 'list', includePermissions ? this.baseFieldsExt : this.baseFields);
        doc = await _decorate(doc);
        return doc;
      }),
    );

    return {
      success: true,
      code: Codes.Success,
      data: docs,
      count: docs.length,
      totalCount: includeCount ? await this.model.countDocuments(_filter) : null,
      query,
    };
  }

  public async create(
    data,
    { populate = this.defaults.createArgs?.populate }: CreateArgs = {},
    {
      skim = this.defaults.createOptions?.skim ?? false,
      includePermissions = this.defaults.createOptions?.includePermissions ?? true,
      populateAccess = this.defaults.createOptions?.populateAccess ?? 'read',
    }: CreateOptions = {},
    decorate?: Function,
  ): Promise<ServiceResult> {
    const isArr = Array.isArray(data);
    let arr = isArr ? data : [data];

    const contexts: MiddlewareContext[] = [];

    let validationError = null;
    const items = await Promise.all(
      arr.map(async (item, index) => {
        const context: MiddlewareContext = { originalData: item };

        const allowedFields = await this.genAllowedFields(item, 'create');
        const allowedData = pick(item, allowedFields);

        const validated = await this.validate(allowedData, 'create', context);
        if (isBoolean(validated)) {
          if (!validated) {
            validationError = { success: false, code: Codes.BadRequest, data: null };
            return;
          }
        } else if (isArray(validated)) {
          if (validated.length > 0) {
            validationError = { success: false, code: Codes.BadRequest, data: null, errors: validated };
            return;
          }
        }

        const preparedData = await this.prepare(allowedData, 'create', context);

        context.preparedData = preparedData;
        contexts.push(context);
        return preparedData;
      }),
    );

    if (validationError) return validationError;

    const _decorate = isFunction(decorate) ? decorate : (v) => v;

    let docs = await this.model.create(items);
    docs = await Promise.all(
      docs.map(async (doc, index) => {
        let includeDocPermissions = includePermissions;
        if (!includeDocPermissions && !skim) {
          includeDocPermissions = this.checkIfModelPermissionExists(['create', 'read', 'update']);
        }
        if (includeDocPermissions) doc = await this.addDocPermissions(doc, 'create', contexts[index]);
        if (includePermissions) doc = await this.addFieldPermissions(doc, 'read', contexts[index]);
        if (populate) await populateDoc(doc, await this.genPopulate(populateAccess, populate));
        doc = await this.pickAllowedFields(doc, 'read', includePermissions ? this.baseFieldsExt : this.baseFields);
        doc = await _decorate(doc, contexts[index]);
        return doc;
      }),
    );

    return {
      success: true,
      code: Codes.Created,
      data: docs,
      input: items,
      count: docs.length,
    };
  }

  public async new(): Promise<ServiceResult> {
    const data = await this.model.new();
    return {
      success: true,
      code: Codes.Success,
      data,
    };
  }

  public async updateOne(
    filter: any,
    data,
    { populate = this.defaults.updateOneArgs?.populate, overrides = {} }: UpdateOneArgs = {},
    {
      skim = this.defaults.updateOneOptions?.skim ?? false,
      includePermissions = this.defaults.updateOneOptions?.includePermissions ?? true,
      populateAccess = this.defaults.updateOneOptions?.populateAccess ?? 'read',
    }: UpdateOneOptions = {},
    decorate?: Function,
  ): Promise<ServiceResult> {
    const { filter: overrideFilter, populate: overridePopulate } = overrides;

    const [_filter, _populate] = await Promise.all([
      overrideFilter || this.genFilter('update', filter),
      overridePopulate || this.genPopulate(populateAccess, populate),
    ]);

    const query = { filter: _filter, populate: _populate };

    if (_filter === false) return { success: false, code: Codes.Forbidden, data: null, query };

    let doc = await this.model.findOne({ filter: _filter });
    if (!doc) return { success: false, code: Codes.NotFound, data: null, query };

    const context: MiddlewareContext = {};

    // see https://mongoosejs.com/docs/api/document.html#Document.prototype.toObject()
    context.originalDocObject = doc.toObject({ virtuals: false });
    context.originalData = data;

    doc = await this.addDocPermissions(doc, 'update', context);
    context.docPermissions = this.getDocPermissions(doc);

    context.currentDoc = doc;
    const allowedFields = await this.genAllowedFields(doc, 'update');
    const allowedData = pick(data, allowedFields);

    const validated = await this.validate(allowedData, 'update', context);
    if (isBoolean(validated)) {
      if (!validated) return { success: false, code: Codes.BadRequest, data: null };
    } else if (isArray(validated)) {
      if (validated.length > 0) return { success: false, code: Codes.BadRequest, data: null, errors: validated };
    }

    const prepared = await this.prepare(allowedData, 'update', context);

    context.preparedData = prepared;
    Object.assign(doc, prepared);

    context.modifiedPaths = doc.modifiedPaths();
    doc = await this.transform(doc, 'update', context);
    context.modifiedPaths = doc.modifiedPaths();
    doc = await doc.save();
    context.finalDocObject = doc.toObject({ virtuals: false });

    let includeDocPermissions = includePermissions;
    if (!includeDocPermissions && !skim) {
      includeDocPermissions = this.checkIfModelPermissionExists(['read', 'update']);
    }
    if (includeDocPermissions) doc = await this.addDocPermissions(doc, 'update', context);
    if (includePermissions) doc = await this.addFieldPermissions(doc, 'update', context);
    if (_populate) await populateDoc(doc, _populate);
    doc = await this.pickAllowedFields(doc, 'read', includePermissions ? this.baseFieldsExt : this.baseFields);

    if (isFunction(decorate)) doc = await decorate(doc, context);
    return { success: true, code: Codes.Success, data: doc, input: prepared };
  }

  public async updateById(
    id: string,
    data,
    { populate = this.defaults.updateByIdArgs?.populate, overrides = {} }: UpdateByIdArgs = {},
    {
      skim = this.defaults.updateByIdOptions?.skim ?? false,
      includePermissions = this.defaults.updateByIdOptions?.includePermissions ?? true,
      populateAccess = this.defaults.updateByIdOptions?.populateAccess ?? 'read',
    }: UpdateByIdOptions = {},
    decorate?: Function,
  ): Promise<ServiceResult> {
    const { populate: overridePopulate, idFilter: overrideIdFilter } = overrides;
    const filter = overrideIdFilter || (await this.genIDFilter(id));

    return this.updateOne(
      filter,
      data,
      {
        populate,
        overrides: {
          populate: overridePopulate,
        },
      },
      { skim, includePermissions, populateAccess },
      decorate,
    );
  }

  public async delete(id: string): Promise<ServiceResult> {
    const filter = await this.genFilter('delete', await this.genIDFilter(id));

    const query = { filter };

    if (filter === false) return { success: false, code: Codes.Forbidden, data: null, query };
    let doc = await this.model.findOne({ filter });
    if (!doc) return { success: false, code: Codes.NotFound, data: null, query };

    // this function utilizes the 'deleteOne' method to delete the document,
    // triggering 'deleteOne' hooks, as opposed to using 'findOneAndDelete'.
    // see https://mongoosejs.com/docs/api/model.html#Model.prototype.deleteOne()
    await ('deleteOne' in doc ? doc.deleteOne() : doc.remove());
    return { success: true, code: Codes.Success, data: doc._id, query };
  }

  public async exists(
    filter: any,
    {
      access = this.defaults.existsOptions?.access ?? 'read',
      includeId = this.defaults.existsOptions?.includeId ?? false,
    }: ExistsOptions = {},
  ): Promise<ServiceResult> {
    filter = await this.genFilter(access, filter);
    const result = await this.model.exists(filter);
    return { success: true, code: Codes.Success, data: includeId ? result : !!result, query: { filter } };
  }

  public async distinct(field: string, { filter }: DistinctArgs = {}): Promise<ServiceResult> {
    filter = await this.genFilter('read', filter);

    const query = { filter };

    if (filter === false) return { success: false, code: Codes.Forbidden, data: null, query };

    const result = await this.model.distinct(field, filter);

    return { success: true, code: Codes.Success, data: result, query };
  }

  public async count(filter, access: BaseFilterAccess = 'list'): Promise<ServiceResult> {
    filter = await this.genFilter(access, filter);

    const query = { filter };

    if (filter === false) return { success: false, code: Codes.Forbidden, data: 0, query };

    return { success: true, code: Codes.Success, data: await this.model.countDocuments(filter), query };
  }

  public getDocPermissions(doc) {
    return getDocPermissions(this.modelName, doc);
  }

  private async operateQuery(filter) {
    const result = await iterateQuery(filter, async (sq: SubQueryEntry, key) => {
      const { model, op, id, filter, args, options, sqOptions = {} } = sq;

      const svc = this.req.macl.getPublicService(model);
      if (!svc) return null;
      if (!ALLOWED_ROUTES.includes(op)) return null;
      let result!: ServiceResult;

      if (op === 'list') {
        result = await svc.find(filter, args, options);
      } else if (op === 'read') {
        if (id) {
          result = await svc.findById(id, args, options);
        } else if (filter) {
          result = await svc.findOne(filter, args, options);
        } else {
          return null;
        }
      }

      if (!result.success) return null;

      let ret = result.data;
      if (sqOptions.path) {
        ret = isArray(ret) ? flatten(ret.map((v) => get(v, sqOptions.path))) : get(ret, sqOptions.path);
      }

      if (sqOptions.compact) {
        ret = compact(ret);
      }

      return ret;
    });

    return result;
  }
}
