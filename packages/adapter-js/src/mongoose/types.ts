// This is a temporary copy from the mongoose repository.
export type AnyArray<T> = T[] | ReadonlyArray<T>;

type Unpacked<T> = T extends (infer U)[] ? U : T extends ReadonlyArray<infer U> ? U : T;

export type ApplyBasicQueryCasting<T> = T | T[] | (T extends (infer U)[] ? U : any) | any;
type Condition<T> = ApplyBasicQueryCasting<T> | QuerySelector<ApplyBasicQueryCasting<T>>;

export type _FilterQuery<T> = {
  [P in keyof T]?: Condition<T[P]>;
} & RootQuerySelector<T>;

type RootQuerySelector<T> = {
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/and/#op._S_and */
  $and?: Array<_FilterQuery<T>>;
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/nor/#op._S_nor */
  $nor?: Array<_FilterQuery<T>>;
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/or/#op._S_or */
  $or?: Array<_FilterQuery<T>>;
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/text */
  $text?: {
    $search: string;
    $language?: string;
    $caseSensitive?: boolean;
    $diacriticSensitive?: boolean;
  };
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/where/#op._S_where */
  $where?: string | Function;
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/comment/#op._S_comment */
  $comment?: string;
  // we could not find a proper TypeScript generic to support nested queries e.g. 'user.friends.name'
  // this will mark all unrecognized properties as any (including nested queries)
  [key: string]: any;
};

type QuerySelector<T> = {
  // Comparison
  $eq?: T;
  $gt?: T;
  $gte?: T;
  $in?: [T] extends AnyArray<any> ? Unpacked<T>[] : T[];
  $lt?: T;
  $lte?: T;
  $ne?: T;
  $nin?: [T] extends AnyArray<any> ? Unpacked<T>[] : T[];
  // Logical
  $not?: T extends string ? QuerySelector<T> | RegExp : QuerySelector<T>;
  // Element
  /**
   * When `true`, `$exists` matches the documents that contain the field,
   * including documents where the field value is null.
   */
  $exists?: boolean;
  $type?: string | number;
  // Evaluation
  $expr?: any;
  $jsonSchema?: any;
  $mod?: T extends number ? [number, number] : never;
  $regex?: T extends string ? RegExp | string : never;
  $options?: T extends string ? string : never;
};
