const { db } = require("../config/connection");
const collections = require("../config/collections");
const bcrypt = require("bcrypt");

module.exports = {
  //* login *//

  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let admin = await db()
        .collection(collections.ADMIN_COLLECTION)
        .findOne({ email: adminData.email });

      if (admin) {
        bcrypt.compare(adminData.password, admin.password).then((status) => {
          if (status) {
            console.log("login succesful");
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db()
        .collection(collections.ORDER_COLLECTION)
        .find({ userId: new ObjectId(userId) }.toArray());
      resolve(orders);
    });
  },

  getOrderProducts: (orderId) => {
    console.log("is order id received to get ordered product? ====>", orderId);
    return new Promise(async (resolve, reject) => {
      let orderItems = await db()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: new ObjectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      console.log("ordered items====>>>>", orderItems);
      resolve(orderItems);
    });
  },
};
