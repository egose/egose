import 'mocha';

import mongoose, { Model, Document, Types } from 'mongoose';
import { expect } from 'chai';
import './00.setup.spec';
import { modelFunctionPlugin, ModelDocument } from '../src/plugins';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

interface ICart {
  name: string;
  price: number;
}

interface ICartMethods {
  test1: (nameSuffix: string, priceAdd: number) => unknown;
  test2: (nameSuffix: string, priceAdd: number) => unknown;
}

interface CardModel extends Model<ICart, {}, ICartMethods> {
  test1(doc: Document, nameSuffix: string, priceAdd: number): unknown;
  test2(doc: Document, nameSuffix: string, priceAdd: number): unknown;
  test1ById: (docId: Types.ObjectId | string, nameSuffix: string, priceAdd: number) => unknown;
}

const cartSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

cartSchema.plugin(modelFunctionPlugin<ICart, ICartMethods>, {
  fnName: 'test1',
  fn: (doc: ModelDocument<ICart, ICartMethods>, nameSuffix: string, priceAdd: number) => {
    doc.name = `${doc.name}_${nameSuffix}`;
    doc.price += priceAdd;
    return doc;
  },
});

cartSchema.plugin(modelFunctionPlugin<ICart, ICartMethods>, {
  fnName: 'test2',
  fn: async (doc: ModelDocument<ICart, ICartMethods>, nameSuffix: string, priceAdd: number) => {
    await sleep(1);
    doc.name = `${doc.name}_${nameSuffix}`;
    doc.price += priceAdd;
    return doc;
  },
});

const Cart = mongoose.model<ICart, CardModel>('Cart', cartSchema);

describe('Model Function Plugin', () => {
  it('should include the document as the first argument', async () => {
    const tname = 'laptop';
    const tprice = 2000;
    const sname = 'premium';
    const sprice = 100;

    let cart = await Cart.create({ name: tname, price: tprice });
    const staticRes = Cart.test1(cart, sname, sprice) as ICart;
    expect(staticRes).not.null;
    expect(staticRes.name).to.equal(`${tname}_${sname}`);
    expect(staticRes.price).to.equal(tprice + sprice);

    cart = await Cart.findOne({ name: tname });
    const instanceRes = cart.test1(sname, sprice) as ICart;
    expect(instanceRes).not.null;
    expect(instanceRes.name).to.equal(`${tname}_${sname}`);
    expect(instanceRes.price).to.equal(tprice + sprice);
  });

  it('should include the document as the first argument of async func', async () => {
    const tname = 'mouse';
    const tprice = 100;
    const sname = 'pink';
    const sprice = 1;

    let cart = await Cart.create({ name: tname, price: tprice });
    const staticRes = (await Cart.test2(cart, sname, sprice)) as ICart;
    expect(staticRes).not.null;
    expect(staticRes.name).to.equal(`${tname}_${sname}`);
    expect(staticRes.price).to.equal(tprice + sprice);

    cart = await Cart.findOne({ name: tname });
    const instanceRes = (await cart.test2(sname, sprice)) as ICart;
    expect(instanceRes).not.null;
    expect(instanceRes.name).to.equal(`${tname}_${sname}`);
    expect(instanceRes.price).to.equal(tprice + sprice);
  });

  it('should find the document by Id', async () => {
    const tname = 'keyboard';
    const tprice = 500;
    const sname = 'mechanical';
    const sprice = 20;

    let cart = await Cart.create({ name: tname, price: tprice });
    const staticRes = (await Cart.test1ById(cart._id, sname, sprice)) as ICart;
    expect(staticRes).not.null;
    expect(staticRes.name).to.equal(`${tname}_${sname}`);
    expect(staticRes.price).to.equal(tprice + sprice);
  });
});
