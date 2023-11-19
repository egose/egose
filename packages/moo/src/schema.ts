export const uniqueNullableString = (field: string, options = {}) => ({
  type: String,
  index: { unique: true, partialFilterExpression: { [field]: { $type: 'string' } } },
  trim: true,
  default: null,
  ...options,
});
