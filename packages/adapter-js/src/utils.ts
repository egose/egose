export function replaceItemById<T extends { _id: string }>(items: T[], newItem: T, options?: { merge: boolean }) {
  const { merge = true } = options ?? {};

  return items.map((item) => {
    if (item._id === newItem._id) {
      return merge ? { ...item, ...newItem } : newItem;
    }

    return item;
  });
}

export function removeItemById<T extends { _id: string }>(items: T[], newItem: T) {
  return items.filter((item) => {
    return item._id !== newItem._id;
  });
}
