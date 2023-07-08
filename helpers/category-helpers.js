const { db } = require("../config/connection");
const collections = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;

module.exports = {

   getAllCategories: () => {
    return new Promise(async (resolve, reject) => {
      let categories = await db()
        .collection(collections.CATEGORY_COLLECTION)
        .find()
        .sort({ created_at: -1 })
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
  updateCategory: (categoryid, body) => {
    const filter = { _id: new ObjectId(categoryid) };
    const update = { $set: body };
    
    return new Promise((resolve,reject)=>{
    db()
      .collection(collections.CATEGORY_COLLECTION)
      .findOneAndUpdate(filter, update)
      .then((result) => {
       resolve();
      });
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

  getcategoryByNameAndId:(body,id)=>{
    return new Promise((resolve,reject)=>{
      db()
      .collection(collections.CATEGORY_COLLECTION)
      .findOne({category_name:body.category_name,_id:{$ne:new ObjectId(id)}})
      .then((response)=>{
        resolve(response);
      });
    });
  },

  getcategoryByName:(body)=>{
    return new Promise((resolve,reject)=>{
      db()
      .collection(collections.CATEGORY_COLLECTION)
      .findOne({category_name:body.category_name})
      .then((response)=>{
        resolve(response);
      });
    });
  },
};

module.exports.CATEGORY_COLLECTION = "category";
