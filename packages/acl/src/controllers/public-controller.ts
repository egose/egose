import compact from 'lodash/compact';
import filter from 'lodash/filter';
import flatten from 'lodash/flatten';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isMatch from 'lodash/isMatch';
import isNil from 'lodash/isNil';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import pick from 'lodash/pick';
import { normalizeSelect, iterateQuery, CustomError } from '../helpers';
import { Controller } from './controller';
import {
  MiddlewareContext,
  FindAccess,
  SubPopulate,
  PublicListArgs,
  PublicListOptions,
  PublicReadArgs,
  PublicReadOptions,
  PublicCreateArgs,
  PublicCreateOptions,
  PublicUpdateArgs,
  PublicUpdateOptions,
  DistinctArgs,
  Request,
  BaseFilterAccess,
  ControllerResult,
} from '../interfaces';

const filterChildren = (children, obj) => {
  if (isPlainObject(obj))
    return obj.$and ? filter(children, (v) => obj.$and.every((q) => isMatch(v, q))) : filter(children, obj);

  return children;
};

const genSubPopulate = (sub: string, popul: any) => {
  if (!popul) return [];

  let populate = Array.isArray(popul) ? popul : [popul];
  populate = populate.map((p: SubPopulate | string) => {
    const ret: SubPopulate = isString(p)
      ? { path: `${sub}.${p}` }
      : {
          path: `${sub}.${p.path}`,
          select: normalizeSelect(p.select),
        };

    return ret;
  });

  return populate;
};

export class PublicController extends Controller {
  baseFields: string[];

  constructor(req: Request, modelName: string) {
    super(req, modelName);
    this.baseFields = ['_id', this.options.permissionField];
  }

  async _list(
    filter: any,
    {
      select = this.defaults.publicListArgs?.select,
      populate = this.defaults.publicListArgs?.populate,
      sort = this.defaults.publicListArgs?.sort,
      skip = this.defaults.publicListArgs?.skip,
      limit = this.defaults.publicListArgs?.limit,
      page = this.defaults.publicListArgs?.page,
      pageSize = this.defaults.publicListArgs?.pageSize,
      process = this.defaults.publicListArgs?.process ?? [],
    }: PublicListArgs = {},
    {
      includePermissions = this.defaults.publicListOptions?.includePermissions ?? true,
      includeCount = this.defaults.publicListOptions?.includeCount ?? false,
      populateAccess = this.defaults.publicListOptions?.populateAccess ?? 'read',
      lean = this.defaults.publicListOptions?.lean ?? false,
    }: PublicListOptions = {},
  ): Promise<ControllerResult> {
    const result = await this.find(
      filter,
      { select, populate, sort, skip, limit, page, pageSize },
      { includePermissions, includeCount, populateAccess, lean },
      async (doc) => {
        doc = await this.pickAllowedFields(doc, 'list', ['_id', this.options.permissionField]);
        return this.decorate(doc, 'list');
      },
    );

    if (!result.success) {
      return result;
    }

    let docs = result.data;
    docs = await this.decorateAll(docs, 'list');
    docs = docs.map((row) => this.process(row, process));

    result.data = docs;
    return result;
  }

  async _create(
    data,
    {
      select = this.defaults.publicCreateArgs?.select,
      populate = this.defaults.publicCreateArgs?.populate,
      process = this.defaults.publicCreateArgs?.process ?? [],
    }: PublicCreateArgs = {},
    {
      includePermissions = this.defaults.publicCreateOptions?.includePermissions ?? true,
      populateAccess = this.defaults.publicCreateOptions?.populateAccess ?? 'read',
    }: PublicCreateOptions = {},
  ): Promise<ControllerResult> {
    const result = await this.create(
      data,
      { populate },
      { includePermissions, populateAccess },
      async (doc, context: MiddlewareContext) => {
        doc = await this.pickAllowedFields(doc, 'read', this.baseFields);
        doc = await this.decorate(doc, 'create', context);
        doc = this.process(doc, process);

        if (select) doc = pick(doc, [...normalizeSelect(select), ...this.baseFields]);
        return doc;
      },
    );

    return result;
  }

  async _new(): Promise<ControllerResult> {
    return this.new();
  }

  async _read(
    id: string,
    {
      select = this.defaults.publicReadArgs?.select,
      populate = this.defaults.publicReadArgs?.populate,
      process = this.defaults.publicReadArgs?.process ?? [],
    }: PublicReadArgs = {},
    {
      includePermissions = this.defaults.publicReadOptions?.includePermissions ?? true,
      tryList = this.defaults.publicReadOptions?.tryList ?? true,
      populateAccess = this.defaults.publicReadOptions?.populateAccess,
      lean = this.defaults.publicReadOptions?.lean ?? false,
    }: PublicReadOptions = {},
  ): Promise<ControllerResult> {
    let access: FindAccess = 'read';
    const idFilter = await this.genIDFilter(id);

    let result = await this.findById(
      id,
      {
        select,
        populate,
        overrides: { idFilter },
      },
      { includePermissions, access, populateAccess, lean },
    );

    // if not found, try to get the doc with 'list' access
    if (!result.data && tryList) {
      access = 'list';

      result = await this.findById(
        id,
        {
          select,
          populate,
          overrides: { idFilter },
        },
        { includePermissions, access, populateAccess, lean },
      );
    }

    if (!result.success) {
      return result;
    }

    let doc = await this.pickAllowedFields(result.data, access, this.baseFields);
    doc = await this.decorate(doc, access);
    doc = this.process(doc, process);

    result.data = doc;
    return result;
  }

  async _update(
    id: string,
    data,
    {
      select = this.defaults.publicUpdateArgs?.select,
      populate = this.defaults.publicUpdateArgs?.populate,
      process = this.defaults.publicUpdateArgs?.process ?? [],
    }: PublicUpdateArgs = {},
    {
      returningAll = this.defaults.publicUpdateOptions?.returningAll ?? true,
      includePermissions = this.defaults.publicUpdateOptions?.includePermissions ?? true,
      populateAccess = this.defaults.publicUpdateOptions?.populateAccess ?? 'read',
    }: PublicUpdateOptions = {},
  ): Promise<ControllerResult> {
    const result = await this.updateById(
      id,
      data,
      { populate },
      { includePermissions, populateAccess },
      async (doc, context: MiddlewareContext) => {
        doc = await this.pickAllowedFields(doc, 'read', this.baseFields);
        doc = await this.decorate(doc, 'update', context);
        doc = this.process(doc, process);

        if (select) doc = pick(doc, [...normalizeSelect(select), ...this.baseFields]);
        else if (!returningAll) doc = pick(doc, [...Object.keys(data), '_id']);

        return doc;
      },
    );

    return result;
  }

  async _delete(id: string): Promise<ControllerResult> {
    const result = await this.delete(id);
    return result;
  }

  async _distinct(field: string, options: DistinctArgs = {}): Promise<ControllerResult> {
    const result = await this.distinct(field, options);
    return result;
  }

  async _count(filter, access: BaseFilterAccess = 'list'): Promise<ControllerResult> {
    const result = await this.count(filter, access);
    return result;
  }

  private async getParentDoc(id, sub, access, populate = []) {
    const parentFilter = await this.genFilter(access, await this.genIDFilter(id));

    if (parentFilter === false) return null;
    return this.model.findOne({ filter: parentFilter, select: sub, populate });
  }

  async listSub(id, sub, options = {}) {
    let { filter: ft, fields } = options as any;

    const parentDoc = await this.getParentDoc(id, sub, 'read');
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subFilter, subSelect] = await Promise.all([
      this.genFilter(`subs.${sub}.list` as any, ft),
      this.genSelect('list', fields, false, [sub, 'sub']),
    ]);

    result = filterChildren(result, subFilter);
    if (subSelect) result = result.map((v) => pick(v, subSelect.concat(['id'])));
    return result;
  }

  async readSub(id, sub, subId, options = {}) {
    let { fields, populate } = options as any;

    const parentDoc = await this.getParentDoc(id, sub, 'read', genSubPopulate(sub, populate));
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subFilter, subSelect] = await Promise.all([
      this.genFilter(`subs.${sub}.read` as any),
      this.genSelect('read', fields, false, [sub, 'sub']),
    ]);

    result = filterChildren(result, subFilter);
    result = result.find((v) => String(v._id) === subId);
    if (!result) return null;

    if (subSelect) result = pick(result, subSelect.concat(['id']));
    return result;
  }

  async updateSub(id, sub, subId, data) {
    const parentDoc = await this.getParentDoc(id, sub, 'update');
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subFilter, subReadSelect, subUpdateSelect] = await Promise.all([
      this.genFilter(`subs.${sub}.update` as any),
      this.genSelect('read', null, false, [sub, 'sub']),
      this.genSelect('update', null, false, [sub, 'sub']),
    ]);

    result = filterChildren(result, subFilter);
    result = result.find((v) => String(v._id) === subId);
    if (!result) return null;

    const allowedData = pick(data, subUpdateSelect);
    Object.assign(result, allowedData);

    await parentDoc.save();
    if (subReadSelect) result = pick(result, subReadSelect.concat(['id']));
    return result;
  }

  async createSub(id, sub, data, options = {}) {
    let { addFirst } = options as any;

    const parentDoc = await this.getParentDoc(id, sub, 'update');
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subCreateSelect, subReadSelect] = await Promise.all([
      this.genSelect('create', null, false, [sub, 'sub']),
      this.genSelect('read', null, false, [sub, 'sub']),
    ]);

    const allowedData = pick(data, subCreateSelect);
    addFirst === true ? result.unshift(allowedData) : result.push(allowedData);

    await parentDoc.save();
    if (subReadSelect) result = result.map((v) => pick(v, subReadSelect.concat(['id'])));
    return result;
  }

  async deleteSub(id, sub, subId) {
    const parentDoc = await this.getParentDoc(id, sub, 'update');
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const subFilter = await this.genFilter(`subs.${sub}.delete` as any);

    result = filterChildren(result, subFilter);
    result = result.find((v) => String(v._id) === subId);
    if (!result) return null;

    // starting from version 7.x, the 'deleteOne' method replaces the 'remove' method for subdocuments.
    // see https://mongoosejs.com/docs/subdocs.html#removing-subdocs
    await ('deleteOne' in result ? result.deleteOne() : result.remove());
    await parentDoc.save();
    return result._id;
  }
}
