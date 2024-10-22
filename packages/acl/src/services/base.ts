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
import uniq from 'lodash/uniq';
import intersectionBy from 'lodash/intersectionBy';
import { getModelOption } from '../options';
import { iterateQuery, CustomError, setDocValue, genPagination, normalizeSelect, populateDoc } from '../helpers';
import {
  Include,
  MiddlewareContext,
  Request,
  Projection,
  SelectAccess,
  DocPermissionsAccess,
  DecorateAccess,
  DecorateAllAccess,
  ValidateAccess,
  PrepareAccess,
  TransformAccess,
  FinalizeAccess,
  BaseFilterAccess,
  ServiceResult,
  SubQueryEntry,
  Task,
} from '../interfaces';
import { FilterOperator } from '../enums';

export class Base {
  req: Request;
  modelName: string;

  constructor(req: Request, modelName: string) {
    this.req = req;
    this.modelName = modelName;
  }

  public decorate(doc: any, access: DecorateAccess, context: MiddlewareContext): Promise<any> {
    return this.req.macl.decorate(this.modelName, doc, access, context);
  }

  public decorateAll(docs: any[], access: DecorateAllAccess, context: MiddlewareContext): Promise<any> {
    return this.req.macl.decorateAll(this.modelName, docs, access, context);
  }

  public genAllowedFields(doc: any, access: SelectAccess, baseFields?: string[]): Promise<string[]> {
    return this.req.macl.genAllowedFields(this.modelName, doc, access, baseFields);
  }

  public genDocPermissions(doc: any, access: DocPermissionsAccess, context: MiddlewareContext): Promise<{}> {
    return this.req.macl.genDocPermissions(this.modelName, doc, access, context);
  }

  public genFilter(access?: BaseFilterAccess, filter?) {
    return this.req.macl.genFilter(this.modelName, access, filter);
  }

  public getIdentifier(): string | null {
    return this.req.macl.getIdentifier(this.modelName);
  }

  public genIDFilter(id: string): Promise<any> {
    return this.req.macl.genIDFilter(this.modelName, id);
  }

  public genPopulate(access?: SelectAccess, populate?): Promise<any[]> {
    return this.req.macl.genPopulate(this.modelName, access, populate);
  }

  public genSelect(
    access: SelectAccess,
    targetFields?: Projection,
    skipChecks?: boolean,
    subPaths?: string[],
  ): Promise<any[]> {
    return this.req.macl.genSelect(this.modelName, access, targetFields, skipChecks, subPaths);
  }

  public addEmptyPermissions(doc: any): any {
    return this.req.macl.addEmptyPermissions(this.modelName, doc);
  }

  public addDocPermissions(doc: any, access: DocPermissionsAccess, context: MiddlewareContext): Promise<any> {
    return this.req.macl.addDocPermissions(this.modelName, doc, access, context);
  }

  public addFieldPermissions(doc: any, access: DocPermissionsAccess, context: MiddlewareContext): Promise<any> {
    return this.req.macl.addFieldPermissions(this.modelName, doc, access, context);
  }

  public pickAllowedFields(doc: any, access: SelectAccess, baseFields?: string[]): Promise<any> {
    return this.req.macl.pickAllowedFields(this.modelName, doc, access, baseFields);
  }

  public prepare(allowedData: any, access: PrepareAccess, context: MiddlewareContext): Promise<any> {
    return this.req.macl.prepare(this.modelName, allowedData, access, context);
  }

  public runTasks(docObject: any, tasks: Task | Task[]): any {
    return this.req.macl.runTasks(this.modelName, docObject, tasks);
  }

  public transform(doc: any, access: TransformAccess, context: MiddlewareContext): Promise<any> {
    return this.req.macl.transform(this.modelName, doc, access, context);
  }

  public finalize(doc: any, access: FinalizeAccess, context: MiddlewareContext): Promise<any> {
    return this.req.macl.finalize(this.modelName, doc, access, context);
  }

  public changes(doc: any, context: MiddlewareContext): Promise<any> {
    return this.req.macl.changes(this.modelName, doc, context);
  }

  public validate(allowedData: any, access: ValidateAccess, context: MiddlewareContext): Promise<boolean | any[]> {
    return this.req.macl.validate(this.modelName, allowedData, access, context);
  }

  public checkIfModelPermissionExists(accesses: DocPermissionsAccess[]) {
    const modelPermissionKeys = getModelOption(this.modelName, '_modelPermissionKeys');
    return accesses.some((access) => modelPermissionKeys[access]?.length > 0);
  }

  protected processInclude(include: Include | Include[]) {
    const includes = compact(castArray(include)).filter(({ model, op, path, localField, foreignField }) => {
      return model && op && path && localField && foreignField;
    });

    // include Include local fields and paths
    let includeLocalFields = [];
    let includePaths = [];

    forEach(includes, (inc) => {
      includeLocalFields.push(inc.localField);
      includePaths.push(inc.path);
    });

    includeLocalFields = uniq(compact(includeLocalFields));
    includePaths = uniq(compact(includePaths));

    return {
      includes,
      includeLocalFields,
      includePaths,
    };
  }

  protected async includeDocs(docs, include: Include | Include[]) {
    if (!include) return docs;

    const includes = compact(castArray(include));
    if (includes.length === 0) return docs;

    const isSingle = !isArray(docs);
    if (isSingle) docs = [docs];

    for (let x = 0; x < includes.length; x++) {
      const include = includes[x];

      if (include.op === 'count') {
        docs = await this.includeDocsCount(docs, include);
      } else {
        docs = await this.includeDocsList(docs, include);
      }
    }

    return isSingle ? docs[0] : docs;
  }

  private async includeDocsList(docs, include: Include) {
    const { model, op, path, localField, foreignField, filter: _filters, args = {}, options = {} } = include;

    const svc = this.req.macl.getPublicService(model);
    if (!svc) return docs;

    const includeLocalValues = [];
    forEach(docs, (doc, i) => {
      includeLocalValues.push(get(doc, localField));
    });

    const filter = { ...(_filters ?? {}), [foreignField]: { $in: flatten(includeLocalValues) } };
    const result = await svc.find(filter, args, {
      ...options,
      lean: true,
      includePermissions: false,
      includeCount: false,
    });

    if (!result.success) return docs;

    for (let y = 0; y < docs.length; y++) {
      const doc = docs[y];
      const localValue = get(doc, localField);
      const filterFn = (row) =>
        intersectionBy(castArray(localValue), castArray(get(row, foreignField)), String).length > 0;
      const matches = result.data.filter(filterFn);
      setDocValue(doc, path, op === 'list' ? matches : matches[0]);
    }

    return docs;
  }

  private async includeDocsCount(docs, include: Include) {
    const { model, path, localField, foreignField, filter: _filters } = include;

    const svc = this.req.macl.getPublicService(model);
    if (!svc) return docs;

    for (let y = 0; y < docs.length; y++) {
      const doc = docs[y];
      const localValue = get(doc, localField);
      const filter = { ...(_filters ?? {}), [foreignField]: localValue };
      const result = await svc.count(filter);
      if (!result.success) continue;

      setDocValue(doc, path, result.data);
    }

    return docs;
  }

  protected async parseClientData(filter) {
    const result = await iterateQuery(filter, async (fo: FilterOperator, val: any, key: string) => {
      switch (fo) {
        case FilterOperator.SubQuery:
          return this.handleSubQuery(val, key);
        case FilterOperator.Date:
          return this.handleDate(val, key);
        default:
          return null;
      }
    });

    return result;
  }

  private async handleSubQuery(sq: SubQueryEntry, key: string) {
    const { model, op, id, filter, args, options, sqOptions = {} } = sq;

    const svc = this.req.macl.getPublicService(model);
    if (!svc) return null;

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
    } else {
      return null;
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
  }

  private async handleDate(val: any, key: string) {
    return new Date();
  }
}
