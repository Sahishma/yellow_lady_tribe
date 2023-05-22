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


};
