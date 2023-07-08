const { db } = require("../config/connection");
const collections = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;
// const { ObjectId } = require('mongodb'); // Import ObjectId from the MongoDB package

module.exports = {
  addproduct: (product) => {
    product.created_at = new Date();
    product.stock = parseInt(product.stock);
    product.deleted = false;
    return new Promise((resolve, reject) => {
      db()
        .collection(collections.PRODUCT_COLLECTION)
        .insertOne(product)
        .then((data) => {
          resolve(data);
        });
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
            $match: {
              deleted: false, // Filter documents with deleted: false
            },
          },
          {
            $lookup: {
              from: collections.CATEGORY_COLLECTION,
              localField: "category_id",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              categoryId: { $toObjectId: "$category_id" }, // Convert category_id to ObjectId
            },
          },
          {
            $lookup: {
              from: collections.CATEGORY_COLLECTION,
              localField: "categoryId",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              product_name: 1,
              slug: 1,
              mrp: 1,
              price: 1,
              stock: 1,
              status: 1,
              created_at: 1,
              category_name: "$category.category_name",
              image_urls:1,
            },
          },
          // {
          //   $sort: {
          //     created_at: -1 // Sort by created_at field in descending order
          //   },
          // },
        ])
        .sort({ created_at: -1 })

        .toArray();
      resolve(products);
    });
  },

  getProductsBySlug: async (slug, productId) => {
    try {
      const product = await db()
        .collection(collections.PRODUCT_COLLECTION)
        // .findOne({ slug : slug });
        .findOne({ slug: slug, _id: { $ne: new ObjectId(productId) } });
      // .sort({ created_at: -1 });

      return product;
    } catch (error) {
      console.log(error);
    }
  },

  // getProductsByCategory: (categoryId) => {
  //   return new Promise(async (resolve, reject) => {
  //     let products = await db()
  //       .collection(collections.PRODUCT_COLLECTION)
  //       .aggregate([
  //         {
  //           $lookup: {
  //             from: collections.CATEGORY_COLLECTION,
  //             localField: "category_id",
  //             foreignField: "_id",
  //             as: "category",
  //           },
  //         },
  //         {
  //           $unwind: {
  //             path: "$category",
  //             preserveNullAndEmptyArrays: true,
  //           },
  //         },
  //         {
  //           $match: {
  //             category_id: categoryId, // Filter by category_id
  //           },
  //         },
  //         {
  //           $project: {
  //             _id: 1,
  //             product_name: 1,
  //             mrp:1,
  //             price: 1,
  //             stock: 1,
  //             status: 1,
  //             category_name: "$category.category_name",
  //           },
  //         },
  //       ])
  //       .toArray();
  //     resolve(products);
  //   });
  // },

  getProductsByCategoryWithPagination: (categoryId, skip, limit) => {
    return new Promise(async (resolve, reject) => {
      let products = await db()
        .collection(collections.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: {
              deleted: false, // Filter documents with deleted: false
            },
          },
          {
            $lookup: {
              from: collections.CATEGORY_COLLECTION,
              localField: "category_id",
              foreignField: "slug",
              as: "category",
            },
          },
          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              category_id: categoryId, // Filter by category_id
            },
          },
          {
            $project: {
              _id: 1,
              product_name: 1,
              slug: 1,
              mrp: 1,
              price: 1,
              stock: 1,
              status: 1,
              category_name: "$category.category_name",
              image_urls:1,
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ])
        .toArray();
      resolve(products);
    });
  },

  getProductsCountByCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      let count = await db()
        .collection(collections.PRODUCT_COLLECTION)
        .countDocuments({ category_id: categoryId });
      resolve(count);
    });
  },

  getProductsCountBySearchQuery: (query) => {
    return new Promise(async (resolve, reject) => {
      let count = await db()
        .collection(collections.PRODUCT_COLLECTION)
        .countDocuments({
          product_name: { $regex: query, $options: "i" },
        });
      resolve(count);
    });
  },

  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db()
        .collection(collections.PRODUCT_COLLECTION)
        .updateOne(
          { _id: new ObjectId(productId) },
          { $set: { deleted: true } }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  getProductDetailsById: (productId) => {
    return new Promise((resolve, reject) => {
      db()
        .collection(collections.PRODUCT_COLLECTION)
        .findOne({ _id: new ObjectId(productId) })
        .then((products) => {
          resolve(products);
        });
    });
  },

  getProductDetails: (slug) => {
    return new Promise((resolve, reject) => {
      db()
        .collection(collections.PRODUCT_COLLECTION)
        .findOne({ slug: slug })
        .then((product) => {
          resolve(product);
        });
    });
  },

  updateProduct: (productId, productDetails) => {
    return new Promise((resolve, reject) => {
      db()
        .collection(collections.PRODUCT_COLLECTION)
        .updateOne(
          { _id: new ObjectId(productId) },
          {
            $set: {
              product_name: productDetails.product_name,
              mrp: productDetails.mrp,
              price: productDetails.price,
              category_id: productDetails.category_id,
              stock: parseInt(productDetails.stock),
              status: productDetails.status,
              discription: productDetails.discription,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  getBySearchQuery: (query, skip, limit) => {
    return new Promise(async (resolve, reject) => {
      let products = await db()
        .collection(collections.PRODUCT_COLLECTION)
        .find({ product_name: { $regex: query, $options: "i" } })
        .skip(skip)
        .limit(limit)
        .toArray();
      resolve(products);
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const pipeline = [
          {
            $match: {
              user: new ObjectId(userId),
            },
          },
          {
            $unwind: "$products",
          },
          {
            $addFields: {
              "products.stock": { $toInt: "$products.stock" },
            },
          },
          {
            $group: {
              _id: "$_id",
              products: { $push: "$products" },
            },
          },
        ];
        const cart = await db()
          .collection(collections.CART_COLLECTION)
          .aggregate(pipeline)
          .toArray();

        if (cart.length === 0) {
          // No cart found for the given user
          resolve([]);
        } else {
          const products = cart[0].products;
          resolve(products);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
};
