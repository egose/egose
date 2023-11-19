import { Document, Schema } from 'mongoose';

export type ModelDocument<T1, T2> = Document<Schema.Types.ObjectId, {}, T1> & T1 & T2;

interface Options<TDocument> {
  fnName: string;
  fn(doc: TDocument): unknown;
}

export function modelFunctionPlugin<
  TRawDocType,
  TInstanceMethods,
  TDocument = ModelDocument<TRawDocType, TInstanceMethods>,
>(schema, options: Options<TDocument>) {
  const { fnName, fn } = options;

  schema.static(fnName, function staticFn(doc: TDocument) {
    return fn.call(this, doc);
  });

  schema.method(fnName, function methodFn() {
    return fn.call(this, this);
  });
}
