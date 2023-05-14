const { db } = require("../config/connection");
const collections = require("../config/collections");
const { response } = require("../app");
var ObjectId = require("mongodb").ObjectId;

module.exports = {
  addproduct: (product, callback) => {
    db()
      .collection("product")
      .insertOne(product)
      .then((data) => {
        callback(data.insertedId.toString());
      });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let product = await db()
        .collection(collections.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(product);
    });
  },
  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db()
        .collection(collections.PRODUCT_COLLECTION)
        .deleteOne({ _id: new ObjectId(productId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getProductDetails: (productId) => {
    return new Promise((resolve, reject) => {
      db()
        .collection(collections.PRODUCT_COLLECTION)
        .findOne({ _id: new ObjectId(productId) })
        .then((products) => {
          console.log(products);
          resolve(products);
        });
    });
  },

  updateProduct:(productId,productDetails)=>{
    return new Promise((resolve,reject)=>{
        db().collection(collections.PRODUCT_COLLECTION)
        .updateOne({_id:new ObjectId(productId)},{
            $set:{
                product_name:productDetails.product_name,
                price:productDetails.price,
                category_name:productDetails.category_name,
                stock:productDetails.stock,
                status:productDetails.status
            }
        }).then((response)=>{
            resolve()
        })
    })
  }

 
};
