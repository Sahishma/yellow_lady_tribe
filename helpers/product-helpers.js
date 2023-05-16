const { db } = require("../config/connection");
const collections = require("../config/collections");
const { response } = require("../app");
var ObjectId = require("mongodb").ObjectId;
// const { ObjectId } = require('mongodb'); // Import ObjectId from the MongoDB package


module.exports = {
  addproduct: (product, callback) => {
    db()
      .collection("product")
      .insertOne(product)
      .then((data) => {
        callback(data.insertedId.toString());
      });
  },


  // getAllProducts: () => {
  //   return new Promise(async (resolve, reject) => {
  //     let product = await db()
  //       .collection(collections.PRODUCT_COLLECTION)
  //       .find()
  //       .toArray();
  //     resolve(product);
  //   });
  // },


  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db()
        .collection(collections.PRODUCT_COLLECTION)
        .aggregate([
          {
            $lookup: {
              from: collections.CATEGORY_COLLECTION,
              localField: "category_id",
              foreignField: "_id",
              as: "category"
            }
          },
          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $addFields: {
              categoryId: { $toObjectId: "$category_id" } // Convert category_id to ObjectId
            }
          },
          {
            $lookup: {
              from: collections.CATEGORY_COLLECTION,
              localField: "categoryId",
              foreignField: "_id",
              as: "category"
            }
          },
          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 1,
              product_name: 1,
              price: 1,
              stock: 1,
              status: 1,
              category_name: "$category.category_name"
            }
          }
        ])
        .toArray();
      resolve(products);
    });
  },
  
  getProductsByCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db()
        .collection(collections.PRODUCT_COLLECTION)
        .aggregate([
          {
            $lookup: {
              from: collections.CATEGORY_COLLECTION,
              localField: "category_id",
              foreignField: "_id",
              as: "category"
            }
          },
          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              category_id: categoryId // Filter by category_id
            }
          },
          {
            $project: {
              _id: 1,
              product_name: 1,
              price: 1,
              stock: 1,
              status: 1,
              category_name: "$category.category_name"
            }
          }
        ])
        .toArray();
      resolve(products);
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
                category_id:productDetails.category_id,
                stock:productDetails.stock,
                status:productDetails.status
            }
        }).then((response)=>{
            resolve()
        })
    })
  }

 
};
