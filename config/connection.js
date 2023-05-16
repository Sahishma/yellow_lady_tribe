require("dotenv").config();
const mongoClient = require("mongodb").MongoClient;

const state = {
  db: null,
};
module.exports.connectToDB = async ()=> {
  try {
    const url = process.env.MONGO_URL;
    const dbname = "yellow";
    const client = await mongoClient.connect(url);
    state.db = client.db(dbname);

    console.log("database connected!👍");
    return state.db;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

module.exports.db = function () {
  return state.db;
};

// const state = {
//   db: null,
// };

// module.exports.connectToDB =function(callback) {
//   const url = process.env.MONGO_URL;
//   const dbname = "yellow";

//   mongoClient.connect(url, (err, client) => {
//     if (err) {
//       console.log(err);
//       return callback(err);
//     }

//     state.db = client.db(dbname);

//     callback();
//   });
// }

// module.exports.get = function () {
//   return state.db;
// };

// module.exports = { connectToDB };

// require("dotenv").config();
// const mongoClient = require("mongodb").MongoClient;

// const state = {
//   db: null,
// };
// module.exports.connect = function (done) {
//   const url = "mongodb://127.0.0.1:27017";
//   const dbname = "shopping";

//   mongoClient.connect(url, (err, data) => {
//     if (err) {
//       return done(err);
//     }

//     state.db = data.db(dbname);

//     done();
//     console.log("🤣");
//   });

//   console.log("🤣");
// };

// const state = {
//   db: null
// };

// module.exports.connect = (done)=> {
//   const url = process.env.MONGO_URL;
//   const dbname = 'yellow';
//     console.log(url);
//     MongoClient.connect(url, (err, client) => {
//     if (err) {
//       console.error('Failed to connect to MongoDB database', err);
//       return done(err);
//     }

//     state.db = client.db(dbname);
//     console.log('Connected to MongoDB database');
//     done();
// });
// };

// module.exports.get = function() {
//   return state.db;
// };
