import {
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
  BaseFilterAccess,
} from '../interfaces';
import {
  decorate,
  decorateAll,
  genAllowedFields,
  genDocPermissions,
  genFilter,
  genIDFilter,
  genPopulate,
  genSelect,
  permit,
  pickAllowedFields,
  prepare,
  process,
  transform,
  validate,
} from '../generators';

export class Base {
  req: Request;
  modelName: string;

  constructor(req: Request, modelName: string) {
    this.req = req;
    this.modelName = modelName;
  }

  public decorate(doc: any, access: DecorateAccess, context?: MiddlewareContext): Promise<any> {
    return decorate.call(this.req, this.modelName, doc, access, context);
  }

  public decorateAll(docs: any[], access: DecorateAllAccess): Promise<any> {
    return decorateAll.call(this.req, this.modelName, docs, access);
  }

  public genAllowedFields(doc: any, access: SelectAccess, baseFields?: string[]): Promise<string[]> {
    return genAllowedFields.call(this.req, this.modelName, doc, access, baseFields);
  }

  public genDocPermissions(doc: any, access: DocPermissionsAccess, context?: MiddlewareContext): Promise<{}> {
    return genDocPermissions.call(this.req, this.modelName, doc, access, context);
  }

  public genFilter(access?: BaseFilterAccess, filter?): Promise<any> {
    return genFilter.call(this.req, this.modelName, access, filter);
  }

  public genIDFilter(id: string): Promise<any> {
    return genIDFilter.call(this.req, this.modelName, id);
  }

  public genPopulate(access?: SelectAccess, populate?): Promise<any[]> {
    return genPopulate.call(this.req, this.modelName, access, populate);
  }

  public genSelect(
    access: SelectAccess,
    targetFields?: Projection,
    skipChecks?: boolean,
    subPaths?: string[],
  ): Promise<any[]> {
    return genSelect.call(this.req, this.modelName, access, targetFields, skipChecks, subPaths);
  }

  public permit(doc: any, access: DocPermissionsAccess, context?: MiddlewareContext): Promise<any> {
    return permit.call(this.req, this.modelName, doc, access, context);
  }

  public pickAllowedFields(doc: any, access: SelectAccess, baseFields?: string[]): Promise<any> {
    return pickAllowedFields.call(this.req, this.modelName, doc, access, baseFields);
  }

  public prepare(allowedData: any, access: PrepareAccess, context?: MiddlewareContext): Promise<any> {
    return prepare.call(this.req, this.modelName, allowedData, access, context);
  }

  public process(docObject: any, pipeline): any {
    return process.call(this.req, this.modelName, docObject, pipeline);
  }

  public transform(doc: any, access: TransformAccess, context?: MiddlewareContext): Promise<any> {
    return transform.call(this.req, this.modelName, doc, access, context);
  }

  public validate(allowedData: any, access: ValidateAccess, context?: MiddlewareContext): Promise<boolean | any[]> {
    return validate.call(this.req, this.modelName, allowedData, access, context);
  }
}
