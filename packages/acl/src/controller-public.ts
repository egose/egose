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
import { normalizeSelect, iterateQuery, CustomError } from './helpers';
import Controller from './controller';
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
  Request,
} from './interfaces';
import { MIDDLEWARE, CORE, PERMISSIONS, PERMISSION_KEYS } from './symbols';

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

class PublicController extends Controller {
  async _list({
    query = {},
    select = this.defaults.list?.select,
    populate = this.defaults.list?.populate,
    sort = this.defaults.list?.sort,
    limit = this.defaults.list?.limit,
    page = this.defaults.list?.page,
    process = [],
    options = this.defaults.list?.options || {},
  }: ListProps = {}) {
    const { includePermissions = true, includeCount = false, populateAccess = 'read', lean = false } = options;

    let docs = await this.find({
      query,
      select,
      populate,
      sort,
      limit,
      page,
      options: { includePermissions, populateAccess, lean },
      decorate: async (doc) => {
        doc = await this.req[CORE]._pickAllowedFields(this.modelName, doc, 'list', [
          '_id',
          this.options.permissionField,
        ]);
        return this.req[CORE]._decorate(this.modelName, doc, 'list');
      },
    });

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

  async _create(data, options: CreateOptions = this.defaults.create || {}) {
    const { includePermissions = true } = options;

    const result = await this.create(data, { includePermissions }, async (doc, context: MiddlewareContext) => {
      doc = await this.req[CORE]._pickAllowedFields(this.modelName, doc, 'read', ['_id', this.options.permissionField]);
      return this.req[CORE]._decorate(this.modelName, doc, 'create', context);
    });

    return result;
  }

  async _empty() {
    return this.empty();
  }

  async _read(
    id,
    {
      select = this.defaults.read?.select,
      populate = this.defaults.read?.populate,
      process = [],
      options = this.defaults.read?.options || {},
    }: ReadProps = {},
  ) {
    let access = 'read';
    const { includePermissions = true, tryList = true, populateAccess, lean = false } = options;
    const idQuery = await this.req[CORE]._genIDQuery(this.modelName, id);

    let doc = await this.findById(id, {
      select,
      populate,
      options: { includePermissions, access, populateAccess, lean },
      overrides: { idQuery },
    });

    // if not found, try to get the doc with 'list' access
    if (!doc && tryList) {
      access = 'list';

      doc = await this.findById(id, {
        select,
        populate,
        options: { includePermissions, access, populateAccess, lean },
        overrides: { idQuery },
      });
    }

    if (!doc) return null;

    doc = await this.req[CORE]._pickAllowedFields(this.modelName, doc, access, ['_id', this.options.permissionField]);
    doc = await this.req[CORE]._decorate(this.modelName, doc, access);
    doc = this.req[CORE]._process(this.modelName, doc, process);

    return doc;
  }

  async _update(id: string, data, options: UpdateOptions = this.defaults.update || {}) {
    const { returningAll = true } = options;

    const result = await this.update(id, data, async (doc, context: MiddlewareContext) => {
      doc = await this.req[CORE]._pickAllowedFields(this.modelName, doc, 'read', ['_id', this.options.permissionField]);
      doc = await this.req[CORE]._decorate(this.modelName, doc, 'update', context);

      return returningAll ? doc : pick(doc, Object.keys(data));
    });

    return result;
  }

  async _delete(id: string) {
    const result = await this.delete(id);
    return result;
  }

  async _distinct(field: string, options: DistinctOptions = this.defaults.distinct || {}) {
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

export default PublicController;
