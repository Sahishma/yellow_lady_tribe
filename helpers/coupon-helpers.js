const { db } = require("../config/connection");
const collections = require("../config/collections");
var ObjectId = require("mongodb").ObjectId;

module.exports = {
  addCoupon: (body) => {
    body.deleted = false;
   body.created_at = new Date();
    return new Promise(async(resolve, reject) => {
     await db()
        .collection(collections.COUPON_COLLECTION)
        .insertOne(body)
        .then((data) => {
          resolve(data);
        });
    });
  },

  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db()
        .collection(collections.COUPON_COLLECTION)
        .find({deleted:false})
        .sort({ created_at: -1 }) // Sort by created_at field in descending order
        .toArray();
      resolve(coupons);
      console.log("coupons", coupons);
    });
  },
  

  getCouponDetails: (couponId) => {
    console.log("entered to getCoupon details", couponId);
    return new Promise(async (resolve, reject) => {
      let coupon = await db()
        .collection(collections.COUPON_COLLECTION)
        .findOne({ _id: new ObjectId(couponId) });
      resolve(coupon);
      console.log("response", coupon);
    });
  },

  updateCoupon: (couponId, body) => {
    return new Promise(async(resolve, reject) => {
    const update = await  db()
        .collection(collections.COUPON_COLLECTION)
        .updateOne(
          { _id: new ObjectId(couponId) },
          {
            $set: {
              title: body.title,
              slug:body.slug,
              coupon_code: body.coupon_code,
              type: body.type,
              value: body.value,
            },
          }
        );
      resolve(update);
    });
  },

  deleteCoupon:async(couponId)=>{
     const deleteCoupon =  await db()
      .collection(collections.COUPON_COLLECTION)
      .updateOne({_id:new ObjectId(couponId)},{$set:{deleted:true}});
        return(deleteCoupon);
  },

  getCouponByCouponCode:async(couponCode,couponId)=>{
    console.log("entered to   getCouponByCouponCode ",couponCode);
    console.log("entered to   getCouponByCouponCode ",couponId);
    try {
    const coupon = await db()
    .collection(collections.COUPON_COLLECTION)
    .findOne({coupon_code:couponCode,_id:{$ne: new ObjectId(couponId)}});
    return coupon;
    }catch (error){
      console.log(error);
    }
  },

  getCouponBySlug: async (slug,couponId) => {
    console.log("couponId",couponId);
    try {
      const coupon = await db()
        .collection(collections.COUPON_COLLECTION)
        // .findOne({ slug : slug });
        .findOne({ slug, _id: { $ne: new ObjectId(couponId) } });

      return coupon;
    } catch (error) {
      console.log(error);
    }
  },

  checkCouponValid: (couponFromUser)=>{
    return new Promise(async(resolve,reject)=>{
     const coupon = await db()
     .collection(collections.COUPON_COLLECTION)
     .findOne({coupon_code: couponFromUser});
     resolve(coupon);
    })
  }
  
};

