const { db } = require("../config/connection");
const collections = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;

module.exports = {
  addBanner: (body) => {
    body.created_at = new Date();
    body.deleted = false;
    return new Promise(async (resolve, reject) => {
      await db()
        .collection(collections.BANNER_COLLECTION)
        .insertOne(body)
        .then((response) => {
          resolve(response);
        });
    });
  },

  getAllBanners: () => {
    return new Promise(async (resolve, reject) => {
      let banners = await db()
        .collection(collections.BANNER_COLLECTION)
        .find({ deleted: false })
        .sort({ created_at: -1 })
        .toArray();
      resolve(banners);
    });
  },

  deleteBanner: (id) => {
    return new Promise((resolve, reject) => {
      db()
        .collection(collections.BANNER_COLLECTION)
        .updateOne({ _id: new ObjectId(id) }, { $set: { deleted: true } })
        .then((response) => {
          resolve(response);
        });
    });
  },

  getBannerDetails: (bannerId) => {
    return new Promise(async (resolve, reject) => {
      await db()
        .collection(collections.BANNER_COLLECTION)
        .findOne({ _id: new ObjectId(bannerId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  updateBanner: (id, body) => {
    return new Promise(async (resolve, reject) => {
    const result = await db()
        .collection(collections.BANNER_COLLECTION)
        .updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              image_url: body.image_url,
              main_title: body.main_title,
              sub_title: body.sub_title,
            },
          }
        );
      resolve(result);
    });
  },
};
