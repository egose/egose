import 'mocha';

import mongoose, { Model, Document } from 'mongoose';
import { expect } from 'chai';
import './00.setup.spec';
import { modelFunctionPlugin, ModelDocument } from '../src/plugins';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

interface ICart {
  name: string;
  price: number;
}

interface ICartMethods {
  test1: () => unknown;
  test2: () => unknown;
}

interface CardModel extends Model<ICart, {}, ICartMethods> {
  test1(doc: Document): unknown;
  test2(doc: Document): unknown;
}

const cartSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

cartSchema.plugin(modelFunctionPlugin<ICart, ICartMethods>, {
  fnName: 'test1',
  fn: (doc: ModelDocument<ICart, ICartMethods>) => {
    doc.name = `${doc.name}_updated`;
    return doc;
  },
});

cartSchema.plugin(modelFunctionPlugin<ICart, ICartMethods>, {
  fnName: 'test2',
  fn: async (doc: ModelDocument<ICart, ICartMethods>) => {
    await sleep(1);
    doc.name = `${doc.name}_updated`;
    return doc;
  },
});

describe('Model Function Plugin', () => {
  it('should include the document as the first argument', async () => {
    const tname = 'laptop';
    const tprice = 2000;

    const Cart = mongoose.model<ICart, CardModel>('Cart', cartSchema);
    let cart = await Cart.create({ name: tname, price: tprice });

    const staticRes = Cart.test1(cart) as ICart;
    expect(staticRes).not.null;
    expect(staticRes.name).to.equal(`${tname}_updated`);
    expect(staticRes.price).to.equal(tprice);

    cart = await Cart.findOne({ name: tname });
    const instanceRes = cart.test1() as ICart;
    expect(instanceRes).not.null;
    expect(instanceRes.name).to.equal(`${tname}_updated`);
    expect(instanceRes.price).to.equal(tprice);
  });

  it('should include the document as the first argument of async func', async () => {
    const tname = 'mouse';
    const tprice = 100;

    const Cart = mongoose.model<ICart, CardModel>('Cart', cartSchema);
    let cart = await Cart.create({ name: tname, price: tprice });

    const staticRes = (await Cart.test2(cart)) as ICart;
    expect(staticRes).not.null;
    expect(staticRes.name).to.equal(`${tname}_updated`);
    expect(staticRes.price).to.equal(tprice);

    cart = await Cart.findOne({ name: tname });
    const instanceRes = (await cart.test2()) as ICart;
    expect(instanceRes).not.null;
    expect(instanceRes.name).to.equal(`${tname}_updated`);
    expect(instanceRes.price).to.equal(tprice);
  });
});
