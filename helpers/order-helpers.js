const { db } = require("../config/connection");
const collections = require("../config/collections");
const { response } = require("../app");
var ObjectId = require("mongodb").ObjectId;



module.exports = {

    getAllOrders: () => {
          return new Promise(async (resolve, reject) => {
            let orders = await db()
              .collection(collections.ORDER_COLLECTION)
              .find()
              .toArray();
            resolve(orders);
          });
         },
// getAllUsers: async () => {
//             try {
//               const users = await db()
//                 .collection(collections.USER_COLLECTION)
//                 .find()
//                 .toArray();
//               return users;
//             } catch (error) {
//               console.log(error);
//             }
//           }
}
