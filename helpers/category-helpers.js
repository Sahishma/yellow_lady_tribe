const { db } = require("../config/connection");
const collections = require("../config/collections");
const { response } = require("../app");
var ObjectId = require("mongodb").ObjectId;

module.exports = {

   getAllCategories: () => {
    return new Promise(async (resolve, reject) => {
      let categories = await db()
        .collection(collections.CATEGORY_COLLECTION)
        .find()
        .toArray();
      resolve(categories);
    });
  },


  addCategory: (category, callback) => {
    db()
      .collection(collections.CATEGORY_COLLECTION)
      .insertOne(category)
      .then((data) => {
        callback(data.insertedId.toString());
      });
  },

  getCategoryById: async (categoryid, callback) => {
    try {
      const category = await db()
        .collection(collections.CATEGORY_COLLECTION)
        .findOne({ _id: new ObjectId(categoryid) });
      if (!category) {
        throw new Error("Category not found");
      }
      callback(category);
    } catch (err) {
      console.log("Error:", err);
      callback(null, err);
    }
  },

  updateCategory: (categoryid, updatedCategory, callback) => {
    const filter = { _id: new ObjectId(categoryid) };
    const update = { $set: updatedCategory };
    const options = { returnOriginal: false };
    db()
      .collection(collections.CATEGORY_COLLECTION)
      .findOneAndUpdate(filter, update, options)
      .then((result) => {
        if (result.value) {
          callback(result.value);
        } else {
          callback(null, new Error("Category not found"));
        }
      })
      .catch((error) => {
        console.log(error);
        callback(null, error);
      });
  },

  deleteCategory: (categoryId) => {
    return new Promise((resolve, reject) => {
      db()
        .collection(collections.CATEGORY_COLLECTION)
        .deleteOne({ _id: new ObjectId(categoryId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
};

module.exports.CATEGORY_COLLECTION = "category";
