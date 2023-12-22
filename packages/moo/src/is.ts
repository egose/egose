import { Types } from 'mongoose';
const { ObjectId } = Types;

export function isObjectId(value) {
  if (!ObjectId.isValid(value)) {
    return false;
  }

  try {
    const asString = value.toString();
    const asObjectId = new ObjectId(asString);
    const asStringifiedObjectId = asObjectId.toString();
    return asString === asStringifiedObjectId;
  } catch (error) {
    return false;
  }
}
