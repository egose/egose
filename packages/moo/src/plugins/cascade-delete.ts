import mongoose, { Document, Types } from 'mongoose';

interface Options {
  model: string;
  localField: string;
  foreignField: string;
}

export function cascadeDeletePlugin(schema, options: Options) {
  const { model, localField, foreignField } = options;

  schema.post('deleteOne', { document: true, query: false }, async function () {
    const Target = mongoose.model(model);

    try {
      const localValue = this.get(localField);
      const query = { [foreignField]: Array.isArray(localValue) ? { $in: localValue } : localValue };
      const documents = await Target.find(query);
      await Promise.all(documents.map((doc) => doc.deleteOne()));
    } catch (err) {
      console.error(err);
    }
  });
}
