import mongoose, { Document, Types } from 'mongoose';

export type ModelDocument<T1, T2> = Document<Types.ObjectId, {}, T1> & T1 & T2;

interface Options<TDocument> {
  fnName: string;
  fn(doc: TDocument, ...args: any[]): unknown;
}

export function modelFunctionPlugin<
  TRawDocType,
  TInstanceMethods,
  TDocument = ModelDocument<TRawDocType, TInstanceMethods>,
>(schema, options: Options<TDocument>) {
  const { fnName, fn } = options;

  schema.static(fnName, function staticFn(doc: TDocument, ...args: any[]) {
    return fn.call(mongoose, doc, ...args);
  });

  schema.method(fnName, function methodFn(...args: any[]) {
    return fn.call(mongoose, this, ...args);
  });

  schema.static(`${fnName}ById`, async function staticByIdFn(docId: Types.ObjectId | string, ...args: any[]) {
    const model = await this.findById(docId);
    if (!model) return null;
    return fn.call(mongoose, model, ...args);
  });
}
