import { getModelOption } from '../options';
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

export class Base {
  req: Request;
  modelName: string;

  constructor(req: Request, modelName: string) {
    this.req = req;
    this.modelName = modelName;
  }

  public decorate(doc: any, access: DecorateAccess, context?: MiddlewareContext): Promise<any> {
    return this.req.macl.decorate(this.modelName, doc, access, context);
  }

  public decorateAll(docs: any[], access: DecorateAllAccess): Promise<any> {
    return this.req.macl.decorateAll(this.modelName, docs, access);
  }

  public genAllowedFields(doc: any, access: SelectAccess, baseFields?: string[]): Promise<string[]> {
    return this.req.macl.genAllowedFields(this.modelName, doc, access, baseFields);
  }

  public genDocPermissions(doc: any, access: DocPermissionsAccess, context?: MiddlewareContext): Promise<{}> {
    return this.req.macl.genDocPermissions(this.modelName, doc, access, context);
  }

  public genFilter(access?: BaseFilterAccess, filter?) {
    return this.req.macl.genFilter(this.modelName, access, filter);
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

  public addDocPermissions(doc: any, access: DocPermissionsAccess, context?: MiddlewareContext): Promise<any> {
    return this.req.macl.addDocPermissions(this.modelName, doc, access, context);
  }

  public addFieldPermissions(doc: any, access: DocPermissionsAccess, context?: MiddlewareContext): Promise<any> {
    return this.req.macl.addFieldPermissions(this.modelName, doc, access, context);
  }

  public pickAllowedFields(doc: any, access: SelectAccess, baseFields?: string[]): Promise<any> {
    return this.req.macl.pickAllowedFields(this.modelName, doc, access, baseFields);
  }

  public prepare(allowedData: any, access: PrepareAccess, context?: MiddlewareContext): Promise<any> {
    return this.req.macl.prepare(this.modelName, allowedData, access, context);
  }

  public process(docObject: any, pipeline): any {
    return this.req.macl.process(this.modelName, docObject, pipeline);
  }

  public transform(doc: any, access: TransformAccess, context?: MiddlewareContext): Promise<any> {
    return this.req.macl.transform(this.modelName, doc, access, context);
  }

  public validate(allowedData: any, access: ValidateAccess, context?: MiddlewareContext): Promise<boolean | any[]> {
    return this.req.macl.validate(this.modelName, allowedData, access, context);
  }

  public checkIfModelPermissionExists(accesses: DocPermissionsAccess[]) {
    const modelPermissionKeys = getModelOption(this.modelName, '_modelPermissionKeys');
    return accesses.some((access) => modelPermissionKeys[access]?.length > 0);
  }
}
