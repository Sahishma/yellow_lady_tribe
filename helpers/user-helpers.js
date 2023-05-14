const { db } = require("../config/connection");
const collections = require("../config/collections");
const bcrypt = require("bcrypt");
var ObjectId = require("mongodb").ObjectId;

module.exports = {

//DoRegister

  doRegister: (userData) => {
    console.log('do redister userData', userData);
    delete userData.password2; 
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      console.log(userData.password, "enc pass");
      db()
        .collection(collections.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          console.log('data inside then of do register', data);
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
        .findOne({ username });
      return user;
    } catch (error) {
      console.log(error);
    }
  },

  getAllUsers: async () => {
    try {
      const users = await db().collection(collections.USER_COLLECTION).find().toArray();
      return users;
    } catch (error) {
      console.log(error);
    }
  },

  unblockUser: async (userId) => {
    try {
      await db().collection(collections.USER_COLLECTION).updateOne(
        { _id:new ObjectId(userId) },
        { $set: { status: false } }
      );
    } catch (error) {
      console.log(error);
    }
  },

  blockUser: async (userId) => {
    try {
      await db().collection(collections.USER_COLLECTION).updateOne(
        { _id:new ObjectId(userId) },
        { $set: { status: true } }
      );
    } catch (error) {
      console.log(error);
    }
  },

};
