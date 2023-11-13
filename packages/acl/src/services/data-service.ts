import { getDataOptions } from '../options';
import { findElement, filterCollection, genPagination, parseSortString } from '../helpers';
import {
  MiddlewareContext,
  Request,
  Projection,
  SelectAccess,
  DecorateAccess,
  DecorateAllAccess,
  BaseFilterAccess,
  DataRouterOptions,
  DataFilter,
  DataFindOneArgs,
  DataFindOneOptions,
  DataFindArgs,
  DataFindOptions,
  ServiceResult,
} from '../interfaces';
import { Codes } from '../enums';
import { orderBy, pick } from 'lodash';

export class DataService<T> {
  req: Request;
  dataName: string;
  options: DataRouterOptions;
  data: T[];

  constructor(req: Request, dataName: string) {
    this.req = req;
    this.dataName = dataName;
    this.options = getDataOptions(dataName);
    this.data = this.options.data ?? [];
  }

  public async findOne(
    filter: DataFilter,
    args?: DataFindOneArgs,
    options?: DataFindOneOptions,
  ): Promise<ServiceResult> {
    const { select } = args ?? {};
    const { access = 'read' } = options ?? {};

    let [_filter, _select] = await Promise.all([this.genFilter(access, filter), this.genSelect(access, select)]);

    const query = {
      filter: _filter,
      select: _select,
    };

    if (_filter === false) return { success: false, code: Codes.Forbidden, data: null, query };

    let doc = await findElement(this.data, _filter);
    if (!doc) return { success: false, code: Codes.NotFound, data: null, query };
    doc = await this.pickAllowedFields(doc, access);
    if (_select.length > 0) doc = pick(doc, _select);

    return { success: true, code: Codes.Success, data: doc, query };
  }

  public async findById(id: string, args?: DataFindOneArgs, options?: DataFindOneOptions): Promise<ServiceResult> {
    const { select } = args ?? {};
    const { access = 'read' } = options ?? {};
    const filter = await this.genIDFilter(id);

    return this.findOne(
      filter,
      {
        select,
      },
      { access },
    );
  }

  public async find(filter: DataFilter, args?: DataFindArgs, options?: DataFindOptions): Promise<ServiceResult> {
    const { select, sort, skip, limit, page, pageSize } = args ?? {};

    const [_filter, _select, pagination] = await Promise.all([
      this.genFilter('list', filter),
      this.genSelect('list', select),
      genPagination({ skip, limit, page, pageSize }, this.options.listHardLimit),
    ]);

    const query = {
      filter: _filter,
      select: _select,
      sort,
      ...pagination,
    };

    if (_filter === false) return { success: false, code: 'forbidden', data: [], count: 0, totalCount: null, query };

    let docs = await filterCollection(this.data, _filter);

    docs = await Promise.all(
      docs.map(async (doc) => {
        doc = await this.pickAllowedFields(doc, 'list');
        if (_select.length > 0) doc = pick(doc, _select);
        return doc;
      }),
    );

    if (sort) {
      const { sortKey, sortOrder } = parseSortString(sort);
      docs = orderBy(docs, [sortKey], [sortOrder]);
    }

    docs = docs.slice(query.skip, query.limit && query.skip + query.limit);

    return {
      success: true,
      code: Codes.Success,
      data: docs,
      count: docs.length,
      totalCount: this.data.length,
      query,
    };
  }

  public decorate(doc: any, access: DecorateAccess, context?: MiddlewareContext): Promise<any> {
    return this.req.dacl.decorate(this.dataName, doc, access, context);
  }

  public decorateAll(docs: any[], access: DecorateAllAccess): Promise<any> {
    return this.req.dacl.decorateAll(this.dataName, docs, access);
  }

  public genAllowedFields(doc: any, access: SelectAccess, baseFields?: string[]): Promise<string[]> {
    return this.req.dacl.genAllowedFields(this.dataName, doc, access, baseFields);
  }

  public genFilter(access?: BaseFilterAccess, filter?) {
    return this.req.dacl.genFilter(this.dataName, access, filter);
  }

  public genIDFilter(id: string): Promise<any> {
    return this.req.dacl.genIDFilter(this.dataName, id);
  }

  public genSelect(
    access: SelectAccess,
    targetFields?: Projection,
    skipChecks?: boolean,
    subPaths?: string[],
  ): Promise<any[]> {
    return this.req.dacl.genSelect(this.dataName, access, targetFields, skipChecks, subPaths);
  }

  public pickAllowedFields(doc: any, access: SelectAccess, baseFields?: string[]): Promise<any> {
    return this.req.dacl.pickAllowedFields(this.dataName, doc, access, baseFields);
  }
}
