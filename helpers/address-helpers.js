const { db } = require("../config/connection");
const collections = require("../config/collections");
const { response } = require("../app");
var ObjectId = require("mongodb").ObjectId;

module.exports = {

    addAddress:async(body)=>{
        try{
          const  newAddress = await db()
          .collection(collections.ADDRESS_COLLECTION)
          .insertOne({
            user_id:new ObjectId(body. userId),
            address_type:body.address_type,
            address: [
                body.user_name,
                body.address, 
                body.city, 
                body.state, 
                body.pinCode,
            ], 
            phone:body.phone,
            default_address:body.default_address
        });
        return newAddress;
        }catch(error){
            console.log(error);
            throw error;
        }
    },
    getAllAddress:async(userId)=>{
        console.log("userId in getAllAddress",userId);
        try{
            const allAddressCursor = db()
            .collection(collections.ADDRESS_COLLECTION)
            .find({user_id:new ObjectId(userId)});

            const allAddress = await allAddressCursor.toArray();

            return allAddress;
        }catch(error){
            console.log(error);
            throw error;
        }
    },
    getAddressDetail:async(addressId)=>{
        console.log(" getAddressDetail",addressId);
        try{
        let addressDetails = await db()
        .collection(collections.ADDRESS_COLLECTION)
        .findOne({_id:new ObjectId(addressId)});
        return addressDetails;
        }catch(error){
            console.log(error);
            throw error;
        }
    },

    updateAddress:async(id,body)=>{
        console.log("id",id,"body",body);
        try{
         let updatedAddress = await db()
           .collection(collections.ADDRESS_COLLECTION)
           .updateOne({_id:new ObjectId(id)},{ $set: {
            address_type:body.address_type,
            address: [
                body.user_name,
                body.address, 
                body.city, 
                body.state, 
                body.pinCode,
            ], 
            phone:body.phone,
            default_address:body.default_address
            } });
           return updatedAddress;
        }catch(error){
            console.log(error);
            throw error
        }
    },

    deleteAddress:async(id)=>{
        console.log("delet address ",id);
        try{
            const deleteAddress = await db()
            .collection(collections.ADDRESS_COLLECTION)
            .deleteOne({_id:new ObjectId(id)});
            return deleteAddress;

        }catch(error){
            console.log(error);
            throw error
        }
    },
    getDefaultAddress: async (userId) => {
      try {
        const defaultAddress = await db()
          .collection(collections.ADDRESS_COLLECTION)
          .findOne({
            user_id: new ObjectId(userId),
            default_address: { $exists: true } // Check if the field exists
          });
    
        return defaultAddress;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    
      

    unmarkDefaultAddress: async (userId) => {
      try {
        await db()
          .collection(collections.ADDRESS_COLLECTION)
          .updateMany(
            { user_id: new ObjectId(userId), default_address: "on" },
            { $set: { default_address: null } }
          );
        await db()
          .collection(collections.ADDRESS_COLLECTION)
          .updateOne(
            { user_id: new ObjectId(userId) },
            { $set: { default_address: "on" } }
          );
      } catch (error) {
        console.error("Error unmarking default address:", error);
        throw error;
      }
    }
    



}