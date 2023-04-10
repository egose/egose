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
} from '../interfaces';
import { MIDDLEWARE, CORE, PERMISSIONS, PERMISSION_KEYS } from '../symbols';

const filterChildren = (children, query) => {
  if (isPlainObject(query))
    return query.$and ? filter(children, (v) => query.$and.every((q) => isMatch(v, q))) : filter(children, query);

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
    {
      query = {},
      select = this.defaults._listArgs?.select,
      populate = this.defaults._listArgs?.populate,
      sort = this.defaults._listArgs?.sort,
      limit = this.defaults._listArgs?.limit,
      page = this.defaults._listArgs?.page,
      process = this.defaults._listArgs?.process ?? [],
    }: PublicListArgs = {},
    {
      includePermissions = this.defaults._listOptions?.includePermissions ?? true,
      includeCount = this.defaults._listOptions?.includeCount ?? false,
      populateAccess = this.defaults._listOptions?.populateAccess ?? 'read',
      lean = this.defaults._listOptions?.lean ?? false,
    }: PublicListOptions = {},
  ) {
    let docs = await this.find(
      {
        query,
        select,
        populate,
        sort,
        limit,
        page,
      },
      { includePermissions, populateAccess, lean },
      async (doc) => {
        doc = await this.req[CORE]._pickAllowedFields(this.modelName, doc, 'list', [
          '_id',
          this.options.permissionField,
        ]);
        return this.req[CORE]._decorate(this.modelName, doc, 'list');
      },
    );

    let rows = await this.req[CORE]._decorateAll(this.modelName, docs, 'list');
    rows = rows.map((row) => this.req[CORE]._process(this.modelName, row, process));

    if (includeCount) {
      return {
        count: await this.model.countDocuments(query),
        rows,
      };
    } else {
      return rows;
    }
  }

  async _create(
    data,
    {
      select = this.defaults._createArgs?.select,
      populate = this.defaults._createArgs?.populate,
      process = this.defaults._createArgs?.process ?? [],
    }: PublicCreateArgs = {},
    {
      includePermissions = this.defaults._createOptions?.includePermissions ?? true,
      populateAccess = this.defaults._createOptions?.populateAccess ?? 'read',
    }: PublicCreateOptions = {},
  ) {
    const result = await this.create(
      data,
      { populate },
      { includePermissions, populateAccess },
      async (doc, context: MiddlewareContext) => {
        doc = await this.req[CORE]._pickAllowedFields(this.modelName, doc, 'read', this.baseFields);
        doc = await this.req[CORE]._decorate(this.modelName, doc, 'create', context);
        doc = this.req[CORE]._process(this.modelName, doc, process);

        if (select) doc = pick(doc, [...normalizeSelect(select), ...this.baseFields]);
        return doc;
      },
    );

    return result;
  }

  async _empty() {
    return this.empty();
  }

  async _read(
    id,
    {
      select = this.defaults._readArgs?.select,
      populate = this.defaults._readArgs?.populate,
      process = this.defaults._readArgs?.process ?? [],
    }: PublicReadArgs = {},
    {
      includePermissions = this.defaults._readOptions?.includePermissions ?? true,
      tryList = this.defaults._readOptions?.tryList ?? true,
      populateAccess = this.defaults._readOptions?.populateAccess,
      lean = this.defaults._readOptions?.lean ?? false,
    }: PublicReadOptions = {},
  ) {
    let access = 'read';
    const idQuery = await this.req[CORE]._genIDQuery(this.modelName, id);

    let doc = await this.findById(
      id,
      {
        select,
        populate,
        overrides: { idQuery },
      },
      { includePermissions, access, populateAccess, lean },
    );

    // if not found, try to get the doc with 'list' access
    if (!doc && tryList) {
      access = 'list';

      doc = await this.findById(
        id,
        {
          select,
          populate,
          overrides: { idQuery },
        },
        { includePermissions, access, populateAccess, lean },
      );
    }

    if (!doc) return null;

    doc = await this.req[CORE]._pickAllowedFields(this.modelName, doc, access, this.baseFields);
    doc = await this.req[CORE]._decorate(this.modelName, doc, access);
    doc = this.req[CORE]._process(this.modelName, doc, process);

    return doc;
  }

  async _update(
    id: string,
    data,
    {
      select = this.defaults._updateArgs?.select,
      populate = this.defaults._updateArgs?.populate,
      process = this.defaults._updateArgs?.process ?? [],
    }: PublicUpdateArgs = {},
    {
      returningAll = this.defaults._updateOptions?.returningAll ?? true,
      includePermissions = this.defaults._updateOptions?.includePermissions ?? true,
      populateAccess = this.defaults._updateOptions?.populateAccess ?? 'read',
    }: PublicUpdateOptions = {},
  ) {
    const result = await this.updateById(
      id,
      data,
      { populate },
      { includePermissions, populateAccess },
      async (doc, context: MiddlewareContext) => {
        doc = await this.req[CORE]._pickAllowedFields(this.modelName, doc, 'read', this.baseFields);
        doc = await this.req[CORE]._decorate(this.modelName, doc, 'update', context);
        doc = this.req[CORE]._process(this.modelName, doc, process);

        if (select) doc = pick(doc, [...normalizeSelect(select), ...this.baseFields]);
        else if (!returningAll) doc = pick(doc, Object.keys(data));

        return doc;
      },
    );

    return result;
  }

  async _delete(id: string) {
    const result = await this.delete(id);
    return result;
  }

  async _distinct(field: string, options: DistinctArgs = {}) {
    const result = await this.distinct(field, options);
    return result;
  }

  async _count(query, access = 'list') {
    const result = await this.count(query, access);
    return result;
  }

  private async getParentDoc(id, sub, access, populate = []) {
    const parentQuery = await this.req[CORE]._genQuery(
      this.modelName,
      access,
      await this.req[CORE]._genIDQuery(this.modelName, id),
    );

    if (parentQuery === false) return null;
    return this.model.findOne({ query: parentQuery, select: sub, populate });
  }

  async listSub(id, sub, options = {}) {
    let { filter: ft, fields } = options as any;

    const parentDoc = await this.getParentDoc(id, sub, 'read');
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subQuery, subSelect] = await Promise.all([
      this.req[CORE]._genQuery(this.modelName, `subs.${sub}.list`, ft),
      this.req[CORE]._genSelect(this.modelName, 'list', fields, false, [sub, 'sub']),
    ]);

    result = filterChildren(result, subQuery);
    if (subSelect) result = result.map((v) => pick(v, subSelect.concat(['id'])));
    return result;
  }

  async readSub(id, sub, subId, options = {}) {
    let { fields, populate } = options as any;

    const parentDoc = await this.getParentDoc(id, sub, 'read', genSubPopulate(sub, populate));
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subQuery, subSelect] = await Promise.all([
      this.req[CORE]._genQuery(this.modelName, `subs.${sub}.read`),
      this.req[CORE]._genSelect(this.modelName, 'read', fields, false, [sub, 'sub']),
    ]);

    result = filterChildren(result, subQuery);
    result = result.find((v) => String(v._id) === subId);
    if (!result) return null;

    if (subSelect) result = pick(result, subSelect.concat(['id']));
    return result;
  }

  async updateSub(id, sub, subId, data) {
    const parentDoc = await this.getParentDoc(id, sub, 'update');
    if (!parentDoc) return null;
    let result = get(parentDoc, sub);

    const [subQuery, subReadSelect, subUpdateSelect] = await Promise.all([
      this.req[CORE]._genQuery(this.modelName, `subs.${sub}.update`),
      this.req[CORE]._genSelect(this.modelName, 'read', null, false, [sub, 'sub']),
      this.req[CORE]._genSelect(this.modelName, 'update', null, false, [sub, 'sub']),
    ]);

    result = filterChildren(result, subQuery);
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
      this.req[CORE]._genSelect(this.modelName, 'create', null, false, [sub, 'sub']),
      this.req[CORE]._genSelect(this.modelName, 'read', null, false, [sub, 'sub']),
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

    const subQuery = await this.req[CORE]._genQuery(this.modelName, `subs.${sub}.delete`);

    result = filterChildren(result, subQuery);
    result = result.find((v) => String(v._id) === subId);
    if (!result) return null;

    await result.remove();
    await parentDoc.save();
    return result._id;
  }
}
