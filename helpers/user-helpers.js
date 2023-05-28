const { db } = require("../config/connection");
const collections = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("../app");
var ObjectId = require("mongodb").ObjectId;

module.exports = {
  //DoRegister

  doRegister: (userData) => {
    console.log("do redister userData", userData);
    delete userData.password2;
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      console.log(userData.password, "enc pass");
      console.log("collections.USER_COLLECTION", collections.USER_COLLECTION);
      db()
        .collection(collections.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          console.log("data inside then of do register", data);
          resolve(data);
        });
    });
  },

  //Dologin

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db()
        .collection(collections.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            console.log("login succesful");
            response.user = user;
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

  getUserByUsername: async (username) => {
    try {
      const user = await db()
        .collection(collections.USER_COLLECTION)
        .findOne({ email: username });
      return user;
    } catch (error) {
      console.log(error);
    }
  },

  getUserByEmail: async (email) => {
    try {
      console.log("email inside getUserByEmail", email);
      const user = await db()
        .collection(collections.USER_COLLECTION)
        .findOne({ email: email });
      console.log("getUserByEmail", user);
      return user;
    } catch (error) {
      console.log(error);
    }
  },

  getUserByPhoneNo: async (phoneNo) => {
    try {
      const user = await db()
        .collection(collections.USER_COLLECTION)
        .findOne({ phone: phoneNo });
      return user;
    } catch (error) {
      console.log(error);
    }
  },

  getAllUsers: async () => {
    try {
      const users = await db()
        .collection(collections.USER_COLLECTION)
        .find()
        .toArray();
      return users;
    } catch (error) {
      console.log(error);
    }
  },

  unblockUser: async (userId) => {
    try {
      await db()
        .collection(collections.USER_COLLECTION)
        .updateOne({ _id: new ObjectId(userId) }, { $set: { status: false } });
    } catch (error) {
      console.log(error);
    }
  },

  blockUser: async (userId) => {
    try {
      await db()
        .collection(collections.USER_COLLECTION)
        .updateOne({ _id: new ObjectId(userId) }, { $set: { status: true } });
    } catch (error) {
      console.log(error);
    }
  },

  generateUserLoginOtp: async (userId, phoneNumber) => {
    console.log("userid from generateUserLoginOtp", userId);
    const otp = Math.floor(1000 + Math.random() * 9000);

    //BOF SENT SMS
    const sentTo = '+91'+phoneNumber;
    const sentMessage = otp + ' is your otp for login to yellOw.';
    console.log('sentTo',sentTo);

    const accountSid = "ACdaa333b52d37048f1ff22285675918f5";
    const authToken = "e56d1fbec755e2a65f3afcc23bcfbecf";
    const client = require("twilio")(accountSid, authToken);
    client.messages
      .create({
        body: sentMessage,
        from: "+13158738602",
        to: sentTo,
      });
      // .then((message) => console.log(message.sid));
      //EOF SENT SMS


    return new Promise((resolve, reject) => {
      db()
        .collection(collections.OTP_COLLECTION)
        .deleteMany({ user_id: userId })
        .then((response) => {
          db()
            .collection(collections.OTP_COLLECTION)
            .insertOne({
              user_id: new ObjectId(userId),
              otp: otp,
            })
            .then((response) => {
              console.log("response from generateUserLoginOtp", response);
              resolve(response);
            });
        });
    });
  },

  // otpValidate: (userId, otp) => {
  //   console.log("user id ", userId);
  //   console.log("otp", otp);
  //   return new Promise(async (resolve, reject) => {
  //     let checkOtp = await db()
  //       .collection(collections.OTP_COLLECTION)
  //       .findOne({ otp: otp })
  //       .then((response) => {
  //         console.log("checking otp", response);
  //         resolve(response);
  //       });
  //   });
  // },

  // otpValidate: async (userId, otp) => {
  //   console.log('userId otpValidate', userId);
  //   console.log('otp otpValidate', otp);
  //   try {
  //     const checkOtp = await db()
  //       .collection(collections.OTP_COLLECTION)
  //       // .findOne({otp:otp});
  //       .findOne({user_id: new ObjectId(userId)});
  //       console.log('checkOtp details from helper function',checkOtp);
  //     if (checkOtp.otp == otp) {
  //       // return "otp valiodated";
  //       let user = await db()
  //       .collection(collections.USER_COLLECTION)
  //       .findOne({ _id: new ObjectId(userId) });
  //       console.log('user details from helper function', user);
  //       response.user = user;
  //       response.status = true;
  //       return response;
  //     }
  //     else{
  //       return "otp not validated"
  //     }
  //     return checkOtp;
  //   } catch (error) {
  //     console.log(error);
  //   }
  // },

  otpValidate: async (userId, otp) => {
    try {
      const otpCollection = db().collection(collections.OTP_COLLECTION);
      const userCollection = db().collection(collections.USER_COLLECTION);

      const checkOtp = await otpCollection.findOne({
        user_id: new ObjectId(userId),
      });

      if (!checkOtp) {
        return { status: false, status_code :1, message: "OTP not found" };
      }

      if (checkOtp.otp != otp) {
        return { status: false, status_code :2, message: "Invalid OTP" };
      }

      const user = await userCollection.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return { status: false, status_code :3, message: "User not found" };
      }

      return { status: true, status_code :4, message: "OTP validated", user };
    } catch (error) {
      console.log(error);
      return { status: false, status_code :5, message: "An error occurred" };
    }
  },

  addToCart: (productId, userId) => {
    console.log("hello enter aadtocart", productId, userId);
    let proObj = {
      item: new ObjectId(productId),
      quantity: 1,
    };
    console.log("proObj", proObj);
    return new Promise(async (resolve, reject) => {
      let userCart = await db()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: new ObjectId(userId) });
      if (userCart) {
        console.log("hello enter to if usercart");
        let proExist = userCart.products.findIndex(
          (product) => product.item.toString() === productId.toString()
        );
        console.log(proExist);

        if (proExist !== -1) {
          console.log("hello donnt worry");
          db()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              {
                user: new ObjectId(userId),
                "products.item": new ObjectId(productId),
              },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
              console.log("add to cart .then");
            });
        } else {
          console.log("if product not exist");
          db()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: new ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
        console.log("hello enter to aadtocart for update cart", proExist);
      } else {
        console.log("hello enter else for add product to new cart");
        let cartObj = {
          user: new ObjectId(userId),
          products: [proObj],
        };
        db()
          .collection(collections.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: new ObjectId(userId) },
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
      resolve(cartItems);
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: new ObjectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            { _id: new ObjectId(details.cart) },
            {
              $pull: { products: { item: new ObjectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        db()
          .collection(collections.CART_COLLECTION)
          .findOneAndUpdate(
            {
              _id: new ObjectId(details.cart),
              "products.item": new ObjectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            },
            { returnOriginal: false }
          )
          .then((response) => {
            resolve({ status: true });
          })
          .catch((error) => {
            reject(error);
          });
      }
    });
  },

  getTotalAmount: (userId) => {
    // console.log("entered to get total amount")
    // console.log("userId ===>",userId);
    return new Promise(async (resolve, reject) => {
      let total = await db()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: new ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: { $toDouble: "$products.quantity" },
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
          {
            $project: {
              total: {
                $multiply: [
                  { $toDouble: "$quantity" },
                  { $toDouble: "$product.price" },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: "$total" },
            },
          },
        ])
        .toArray();
      // console.log("total of each product===>",total);
      if (total.length > 0) {
        resolve(total[0].totalPrice);
      } else {
        resolve(0);
      }
    });
  },

  checkOut: (order, products, total) => {
    return new Promise((resolve, reject) => {
      console.log(order, products, total);
      let status = order.payment === "COD" ? "Placed" : "Pending";
      console.log("status--------->", status);
      let orderObj = {
        deliveryDetails: {
          firstName: order.firstName,
          lastName: order.lastName,
          mobile: order.mobileNumber,
          address: order.address,
          city: order.city,
          state: order.state,
          pincode: order.pinCode,
        },
        userId: new ObjectId(order.userId),
        payment: order.payment,
        products: products,
        totalAmount: total,
        status: status,
        date: new Date(),
      };
      console.log("status in orderObj-------->", status);
      db()
        .collection(collections.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          // const orderId = response.insertedId;
          db()
            .collection(collections.CART_COLLECTION)
            .deleteOne({ user: new ObjectId(order.userId) });
          resolve(response);
          console.log("status in orderObj222222-------->", status);
        });
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: new ObjectId(userId) });
      resolve(cart.products);
    });
  },

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db()
        .collection(collections.ORDER_COLLECTION)
        .find({ userId: new ObjectId(userId) })
        .toArray();
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
