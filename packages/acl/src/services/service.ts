import castArray from 'lodash/castArray';
import forEach from 'lodash/forEach';
import compact from 'lodash/compact';
import flatten from 'lodash/flatten';
import get from 'lodash/get';
import set from 'lodash/set';
import map from 'lodash/map';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import pick from 'lodash/pick';
import omit from 'lodash/omit';
import uniq from 'lodash/uniq';
import intersectionBy from 'lodash/intersectionBy';
import diff from 'deep-diff';
import Model from '../model';
import { getModelOption, getModelOptions } from '../options';
import {
  getDocPermissions,
  genPagination,
  normalizeSelect,
  populateDoc,
  filterCollection,
  findElement,
  findElementById,
  toObject,
  genSubPopulate,
} from '../helpers';
import {
  Filter,
  Include,
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
  FindAccess,
} from '../interfaces';
import { Codes, StatusCodes } from '../enums';
import { Base } from './base';

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
    filter: Filter,
    {
      select = this.defaults.findOneArgs?.select,
      populate = this.defaults.findOneArgs?.populate,
      include = this.defaults.findOneArgs?.include,
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
      overrideFilter || this.genFilter(access, await this.operateQuery(filter)),
      overrideSelect || this.genSelect(access, select),
      overridePopulate || this.genPopulate(populateAccess || access, populate),
    ]);

    const finalSelect = normalizeSelect(_select);
    const { includes, includeLocalFields, includePaths } = this.processInclude(include);

    const query = {
      filter: _filter,
      select: finalSelect.concat(includeLocalFields),
      populate: _populate,
    };

    if (_filter === false) return { success: false, code: Codes.Forbidden, data: null, query };

    let doc = await this.model.findOne({ filter: _filter, select: _select, populate: _populate, lean });
    if (!doc) return { success: false, code: Codes.NotFound, data: null, query };

    const context: MiddlewareContext = { originalDocObject: toObject(doc) };

    doc = await this.includeDocs(doc, includes);

    let includeDocPermissions = includePermissions;
    if (!includeDocPermissions && !skim) {
      includeDocPermissions = this.checkIfModelPermissionExists([access, 'read', 'update']);
    }
    if (includeDocPermissions) doc = await this.addDocPermissions(doc, access);
    if (includePermissions) doc = await this.addFieldPermissions(doc, access);
    doc = await this.pickAllowedFields(
      doc,
      access,
      this.baseFieldsExt.concat(includePaths, normalizeSelect(overrideSelect)),
    );
    if (!includePermissions) doc = this.addEmptyPermissions(doc);

    return { success: true, code: Codes.Success, data: doc, query, context };
  }

  public async findById(
    id: string,
    {
      select = this.defaults.findByIdArgs?.select,
      populate = this.defaults.findByIdArgs?.populate,
      include = this.defaults.findByIdArgs?.include,
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
        include,
        overrides: {
          select: overrideSelect,
          populate: overridePopulate,
        },
      },
      { skim, includePermissions, access, populateAccess, lean },
    );
  }

  public async find(
    filter: Filter,
    {
      select = this.defaults.findArgs?.select,
      populate = this.defaults.findArgs?.populate,
      include = this.defaults.findArgs?.include,
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

    const finalSelect = normalizeSelect(_select);

    // filter populated fields based on select fields
    const filteredPopulate =
      isArray(finalSelect) && isArray(_populate)
        ? _populate.filter((p) => finalSelect.includes(p.path.split('.')[0]))
        : _populate;

    const { includes, includeLocalFields, includePaths } = this.processInclude(include);

    const query = {
      filter: _filter,
      select: finalSelect.concat(includeLocalFields),
      populate: filteredPopulate,
      sort,
      ...pagination,
    };

    if (_filter === false) return { success: false, code: 'forbidden', data: [], count: 0, totalCount: null, query };

    let docs = await this.model.find({
      ...query,
      lean,
    });

    const contexts: MiddlewareContext[] = docs.map((doc) => ({ originalDocObject: toObject(doc) }));

    const _decorate = isFunction(decorate) ? decorate : (v) => v;

    docs = await this.includeDocs(docs, includes);

    docs = await Promise.all(
      docs.map(async (doc, i) => {
        let includeDocPermissions = includePermissions;
        if (!includeDocPermissions && !skim) {
          includeDocPermissions = this.checkIfModelPermissionExists(['list', 'read', 'update']);
        }
        if (includeDocPermissions) doc = await this.addDocPermissions(doc, 'list');
        if (includePermissions) doc = await this.addFieldPermissions(doc, 'list');
        doc = await this.pickAllowedFields(
          doc,
          'list',
          this.baseFieldsExt.concat(includePaths, normalizeSelect(overrideSelect)),
        );
        doc = await _decorate(doc, contexts[i]);
        if (!includePermissions) doc = this.addEmptyPermissions(doc);

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
      contexts,
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
        doc = await this.finalize(doc, 'create', contexts[index]);
        contexts[index].finalDocObject = doc.toObject({ virtuals: false });
        let includeDocPermissions = includePermissions;
        if (!includeDocPermissions && !skim) {
          includeDocPermissions = this.checkIfModelPermissionExists(['create', 'read', 'update']);
        }
        if (includeDocPermissions) doc = await this.addDocPermissions(doc, 'create', contexts[index]);
        if (includePermissions) doc = await this.addFieldPermissions(doc, 'read', contexts[index]);
        if (populate) await populateDoc(doc, await this.genPopulate(populateAccess, populate));
        doc = await this.pickAllowedFields(doc, 'read', this.baseFieldsExt);
        doc = await _decorate(doc, contexts[index]);
        if (!includePermissions) doc = this.addEmptyPermissions(doc);

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
    filter: Filter,
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
    doc = await doc.save();
    doc = await this.finalize(doc, 'update', context);
    context.finalDocObject = doc.toObject({ virtuals: false });

    const diffExcludeFields = [this.options.permissionField, '__v'];
    context.changes =
      diff(omit(context.originalDocObject, diffExcludeFields), omit(context.finalDocObject, diffExcludeFields)) || [];
    context.modifiedPaths = uniq(context.changes.map((di) => (di.path.length > 0 ? di.path[0] : '')));

    let includeDocPermissions = includePermissions;
    if (!includeDocPermissions && !skim) {
      includeDocPermissions = this.checkIfModelPermissionExists(['read', 'update']);
    }
    if (includeDocPermissions) doc = await this.addDocPermissions(doc, 'update', context);
    if (includePermissions) doc = await this.addFieldPermissions(doc, 'update', context);
    if (_populate) await populateDoc(doc, _populate);
    doc = await this.pickAllowedFields(doc, 'read', this.baseFieldsExt);

    if (isFunction(decorate)) doc = await decorate(doc, context);
    if (!includePermissions) doc = this.addEmptyPermissions(doc);

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
    filter: Filter,
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

  async listSub(id, sub, options?: { filter: any; fields: string[] }): Promise<ServiceResult> {
    let { filter: ft, fields } = options ?? {};

    const parentDoc = await this.getParentDoc(id, sub, null, { access: 'read' });
    if (!parentDoc) return { success: false, code: Codes.NotFound, data: [] };
    let result = get(parentDoc, sub);

    const [subFilter, subSelect] = await Promise.all([
      this.genFilter(`subs.${sub}.list`, ft),
      this.genSelect('list', fields, false, [sub, 'sub']),
    ]);

    if (subFilter === false) return { success: false, code: Codes.Forbidden, data: [] };

    result = filterCollection(result, subFilter);
    if (subSelect) result = result.map((v) => pick(toObject(v), subSelect.concat('_id')));

    return { success: true, code: Codes.Success, data: result };
  }

  public async readSub(id, sub, subId, options?: { fields: string[]; populate: any }): Promise<ServiceResult> {
    let { fields, populate } = options ?? {};

    const parentDoc = await this.getParentDoc(id, sub, { populate }, { access: 'read' });
    if (!parentDoc) return { success: false, code: Codes.NotFound, data: null };
    let result = get(parentDoc, sub);

    const [subFilter, subSelect] = await Promise.all([
      this.genFilter(`subs.${sub}.read` as any, { _id: subId }),
      this.genSelect('read', fields, false, [sub, 'sub']),
    ]);

    if (subFilter === false) return { success: false, code: Codes.Forbidden, data: null };

    result = findElement(result, subFilter);
    if (!result) return { success: false, code: Codes.NotFound, data: null };

    if (subSelect) result = pick(toObject(result), subSelect.concat(['_id']));
    return { success: true, code: Codes.Success, data: result };
  }

  public async updateSub(id, sub, subId, data): Promise<ServiceResult> {
    const parentDoc = await this.getParentDoc(id, sub, null, { access: 'update' });
    if (!parentDoc) return { success: false, code: Codes.NotFound, data: null };
    let result = get(parentDoc, sub);

    const [subFilter, subReadSelect, subUpdateSelect] = await Promise.all([
      this.genFilter(`subs.${sub}.update`, { _id: subId }),
      this.genSelect('read', null, false, [sub, 'sub']),
      this.genSelect('update', null, false, [sub, 'sub']),
    ]);

    if (subFilter === false) return { success: false, code: Codes.Forbidden, data: null };

    result = findElement(result, subFilter);
    if (!result) return { success: false, code: Codes.NotFound, data: null };

    const allowedData = pick(data, subUpdateSelect);
    Object.assign(result, allowedData);

    await parentDoc.save();
    if (subReadSelect) result = pick(toObject(result), subReadSelect.concat(['_id']));
    return { success: true, code: Codes.Success, data: result };
  }

  public async bulkUpdateSub(id, sub, data): Promise<ServiceResult> {
    const parentDoc = await this.getParentDoc(id, sub, null, { access: 'update' });
    if (!parentDoc) return { success: false, code: Codes.NotFound, data: null };
    let result = get(parentDoc, sub);

    data = castArray(data);

    const [subFilter, subReadSelect, subUpdateSelect] = await Promise.all([
      this.genFilter(`subs.${sub}.update`, { _id: { $in: data.map((v) => v._id) } }),
      this.genSelect('read', null, false, [sub, 'sub']),
      this.genSelect('update', null, false, [sub, 'sub']),
    ]);

    if (subFilter === false) return { success: false, code: Codes.Forbidden, data: null };

    result = filterCollection(result, subFilter);
    forEach(result, (subdoc) => {
      const tdata = findElementById(data, subdoc._id);
      if (!tdata) return;

      const allowedData = pick(tdata, subUpdateSelect);
      Object.assign(subdoc, allowedData);
    });

    await parentDoc.save();
    if (subReadSelect) result = result.map((v) => pick(toObject(v), subReadSelect.concat(['_id'])));
    return { success: true, code: Codes.Success, data: result };
  }

  public async createSub(id, sub, data, options?: { addFirst: boolean }): Promise<ServiceResult> {
    const { addFirst } = options ?? {};

    const parentDoc = await this.getParentDoc(id, sub, null, { access: 'update' });
    if (!parentDoc) return { success: false, code: Codes.NotFound, data: null };
    let result = get(parentDoc, sub);

    const [subCreateSelect, subReadSelect] = await Promise.all([
      this.genSelect('create', null, false, [sub, 'sub']),
      this.genSelect('read', null, false, [sub, 'sub']),
    ]);

    const allowedData = pick(data, subCreateSelect);
    addFirst === true ? result.unshift(allowedData) : result.push(allowedData);

    await parentDoc.save();
    if (subReadSelect) result = result.map((v) => pick(toObject(v), subReadSelect.concat(['_id'])));
    return { success: true, code: Codes.Created, data: result };
  }

  public async deleteSub(id, sub, subId): Promise<ServiceResult> {
    const parentDoc = await this.getParentDoc(id, sub, null, { access: 'update' });
    if (!parentDoc) return { success: false, code: Codes.NotFound, data: null };
    let result = get(parentDoc, sub);

    const subFilter = await this.genFilter(`subs.${sub}.delete` as any, { _id: subId });
    if (subFilter === false) return { success: false, code: Codes.Forbidden, data: null };

    result = findElement(result, subFilter);
    if (!result) return { success: false, code: Codes.NotFound, data: null };

    // starting from version 7.x, the 'deleteOne' method replaces the 'remove' method for subdocuments.
    // see https://mongoosejs.com/docs/subdocs.html#removing-subdocs
    await ('deleteOne' in result ? result.deleteOne() : result.remove());
    await parentDoc.save();
    return { success: true, code: Codes.Success, data: result._id };
  }

  public async getParentDoc(
    id,
    sub,
    args?: { populate?: SubPopulate | SubPopulate[] },
    options?: { access?: any; lean?: boolean },
  ) {
    const { populate } = args ?? {};
    const { access = 'read', lean = false } = options ?? {};

    const parentFilter = await this.genFilter(access, await this.genIDFilter(id));

    if (parentFilter === false) return null;
    return this.model.findOne({ filter: parentFilter, select: sub, populate: genSubPopulate(sub, populate), lean });
  }
}
