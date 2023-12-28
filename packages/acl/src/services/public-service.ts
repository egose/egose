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
import { normalizeSelect, toObject } from '../helpers';
import { Service } from './service';
import {
  Filter,
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
  ServiceResult,
  Task,
} from '../interfaces';

export class PublicService extends Service {
  // constructor(req: Request, modelName: string) {
  //   super(req, modelName);
  // }

  async _list(
    filter: Filter,
    {
      select = this.defaults.publicListArgs?.select,
      populate = this.defaults.publicListArgs?.populate,
      include = this.defaults.publicListArgs?.include,
      sort = this.defaults.publicListArgs?.sort,
      skip = this.defaults.publicListArgs?.skip,
      limit = this.defaults.publicListArgs?.limit,
      page = this.defaults.publicListArgs?.page,
      pageSize = this.defaults.publicListArgs?.pageSize,
      tasks = this.defaults.publicListArgs?.tasks ?? [],
    }: PublicListArgs = {},
    {
      skim = this.defaults.publicListOptions?.skim ?? true,
      includePermissions = this.defaults.publicListOptions?.includePermissions ?? false,
      includeCount = this.defaults.publicListOptions?.includeCount ?? false,
      populateAccess = this.defaults.publicListOptions?.populateAccess ?? 'read',
      lean = this.defaults.publicListOptions?.lean ?? true,
    }: PublicListOptions = {},
  ): Promise<ServiceResult> {
    const result = await this.find(
      filter,
      { select, populate, include, sort, skip, limit, page, pageSize },
      { skim, includePermissions, includeCount, populateAccess, lean },
      async (doc, context: MiddlewareContext) => {
        doc = toObject(doc);
        return this.decorate(doc, 'list', context);
      },
    );

    if (!result.success) {
      return result;
    }

    let docs = result.data;
    docs = await this.decorateAll(docs, 'list', { model: this.model.model, modelName: this.modelName });
    docs = docs.map((row) => this.runTasks(row, tasks));

    result.data = docs;
    return result;
  }

  async _create(
    data,
    {
      select = this.defaults.publicCreateArgs?.select,
      populate = this.defaults.publicCreateArgs?.populate,
      tasks = this.defaults.publicCreateArgs?.tasks ?? [],
    }: PublicCreateArgs = {},
    {
      skim = this.defaults.publicCreateOptions?.skim ?? false,
      includePermissions = this.defaults.publicCreateOptions?.includePermissions ?? true,
      populateAccess = this.defaults.publicCreateOptions?.populateAccess ?? 'read',
    }: PublicCreateOptions = {},
  ): Promise<ServiceResult> {
    const result = await this.create(
      data,
      { populate },
      { skim, includePermissions, populateAccess },
      async (doc, context: MiddlewareContext) => {
        doc = toObject(doc);
        doc = await this.decorate(doc, 'create', context);
        doc = this.runTasks(doc, tasks);

        if (select) doc = pick(doc, [...normalizeSelect(select), ...this.baseFieldsExt]);
        return doc;
      },
    );

    return result;
  }

  async _new(): Promise<ServiceResult> {
    return this.new();
  }

  async _read(
    id: string,
    {
      select = this.defaults.publicReadArgs?.select,
      populate = this.defaults.publicReadArgs?.populate,
      include = this.defaults.publicReadArgs?.include,
      tasks = this.defaults.publicReadArgs?.tasks ?? [],
    }: PublicReadArgs = {},
    {
      skim = this.defaults.publicReadOptions?.skim ?? false,
      includePermissions = this.defaults.publicReadOptions?.includePermissions ?? true,
      tryList = this.defaults.publicReadOptions?.tryList ?? true,
      populateAccess = this.defaults.publicReadOptions?.populateAccess,
      lean = this.defaults.publicReadOptions?.lean ?? false,
    }: PublicReadOptions = {},
  ): Promise<ServiceResult> {
    let access: FindAccess = 'read';
    const idFilter = await this.genIDFilter(id);

    let result = await this.findById(
      id,
      {
        select,
        populate,
        include,
        overrides: { idFilter },
      },
      { skim, includePermissions, access, populateAccess, lean },
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
        { skim, includePermissions, access, populateAccess, lean },
      );
    }

    if (!result.success) {
      return result;
    }

    let doc = toObject(result.data);
    doc = await this.decorate(doc, access, result.context);
    doc = this.runTasks(doc, tasks);

    result.data = doc;
    return result;
  }

  async _readFilter(
    filter: Filter,
    {
      select = this.defaults.publicReadArgs?.select,
      populate = this.defaults.publicReadArgs?.populate,
      include = this.defaults.publicReadArgs?.include,
      tasks = this.defaults.publicReadArgs?.tasks ?? [],
    }: PublicReadArgs = {},
    {
      skim = this.defaults.publicReadOptions?.skim ?? false,
      includePermissions = this.defaults.publicReadOptions?.includePermissions ?? true,
      tryList = this.defaults.publicReadOptions?.tryList ?? true,
      populateAccess = this.defaults.publicReadOptions?.populateAccess,
      lean = this.defaults.publicReadOptions?.lean ?? false,
    }: PublicReadOptions = {},
  ): Promise<ServiceResult> {
    let access: FindAccess = 'read';

    let result = await this.findOne(
      filter,
      {
        select,
        populate,
        include,
        overrides: {},
      },
      { skim, includePermissions, access, populateAccess, lean },
    );

    // if not found, try to get the doc with 'list' access
    if (!result.data && tryList) {
      access = 'list';

      result = await this.findOne(
        filter,
        {
          select,
          populate,
          overrides: {},
        },
        { skim, includePermissions, access, populateAccess, lean },
      );
    }

    if (!result.success) {
      return result;
    }

    let doc = toObject(result.data);
    doc = await this.decorate(doc, access, result.context);
    doc = this.runTasks(doc, tasks);

    result.data = doc;
    return result;
  }

  async _update(
    id: string,
    data,
    {
      select = this.defaults.publicUpdateArgs?.select,
      populate = this.defaults.publicUpdateArgs?.populate,
      tasks = this.defaults.publicUpdateArgs?.tasks ?? [],
    }: PublicUpdateArgs = {},
    {
      skim = this.defaults.publicUpdateOptions?.skim ?? false,
      returningAll = this.defaults.publicUpdateOptions?.returningAll ?? true,
      includePermissions = this.defaults.publicUpdateOptions?.includePermissions ?? true,
      populateAccess = this.defaults.publicUpdateOptions?.populateAccess ?? 'read',
    }: PublicUpdateOptions = {},
  ): Promise<ServiceResult> {
    const result = await this.updateById(
      id,
      data,
      { populate },
      { skim, includePermissions, populateAccess },
      async (doc, context: MiddlewareContext) => {
        doc = toObject(doc);
        doc = await this.decorate(doc, 'update', context);
        doc = this.runTasks(doc, tasks);

        if (select) doc = pick(doc, [...normalizeSelect(select), ...this.baseFieldsExt]);
        else if (!returningAll) doc = pick(doc, [...Object.keys(data), '_id']);

        return doc;
      },
    );

    return result;
  }

  async _delete(id: string): Promise<ServiceResult> {
    const result = await this.delete(id);
    return result;
  }

  async _distinct(field: string, options: DistinctArgs = {}): Promise<ServiceResult> {
    const result = await this.distinct(field, options);
    return result;
  }

  async _count(filter, access: BaseFilterAccess = 'list'): Promise<ServiceResult> {
    const result = await this.count(filter, access);
    return result;
  }
}
