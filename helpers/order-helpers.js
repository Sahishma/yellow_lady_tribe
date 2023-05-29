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
  getOrderDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      order = await db()
        .collection(collections.ORDER_COLLECTION)
        .findOne({ _id: new ObjectId(orderId) })
        .then((order) => {
          console.log("order here=========>", order);
          resolve(order);
        });
    });
  },

  // getOrderDetailsWithProduct: async (orderId) => {
  //   console.log("entered getOrderDetailsWithProduct", orderId);
  //   try {
  //     // Assuming you have access to the MongoDB client and the relevant collections

  //     // Convert the order ID from string to ObjectId
  //     const orderIdObj = new ObjectId(orderId);

  //     // Aggregation pipeline to fetch the order details with product title and price
  //     const pipeline = [
  //       // Match the order by ID
  //       {
  //         $match: {
  //           _id: orderIdObj,
  //         },
  //       },
  //       // Unwind the products array
  //       {
  //         $unwind: "$products",
  //       },
  //       // Lookup to get product details based on the item IDs
  //       {
  //         $lookup: {
  //           from: "product",
  //           localField: "products.item",
  //           foreignField: "_id",
  //           as: "productDetails",
  //         },
  //       },
  //       // Group back to restore the original structure
  //       {
  //         $group: {
  //           _id: "$_id",
  //           deliveryDetails: { $first: "$deliveryDetails" },
  //           payment: { $first: "$payment" },
  //           totalAmount: { $first: "$totalAmount" },
  //           status: { $first: "$status" },
  //           date: { $first: "$date" },
  //           products: {
  //             $push: {
  //               item: "$products.item",
  //               quantity: "$products.quantity",
  //               productDetails: {
  //                 $arrayElemAt: [
  //                   "$productDetails",
  //                   {
  //                     $indexOfArray: ["$productDetails._id", "$products.item"],
  //                   },
  //                 ],
  //               },
  //             },
  //           },
  //         },
  //       },
  //       // Project to reshape the output
  //       // Project to reshape the output
  //       {
  //         $project: {
  //           _id: 1,
  //           deliveryDetails: 1,
  //           payment: 1,
  //           totalAmount: 1,
  //           status: 1,
  //           date: 1,
  //           products: {
  //             $map: {
  //               input: "$products",
  //               as: "product",
  //               in: {
  //                 productId: "$$product.item",
  //                 productName: {
  //                   $arrayElemAt: ["$$product.productDetails.product_name", 0],
  //                 },
  //                 price: {
  //                   $arrayElemAt: ["$$product.productDetails.price", 0],
  //                 },
  //                 quantity: "$$product.quantity",
  //               },
  //             },
  //           },
  //         },
  //       },
  //     ];

  //     // Execute the aggregation pipeline
  //     const result = await db()
  //       .collection(collections.ORDER_COLLECTION)
  //       .aggregate(pipeline)
  //       .toArray();
  //     console.log("Execute the aggregation pipeline", result);

  //     // If order is not found, return null or handle the error accordingly
  //     if (result.length === 0) {
  //       return null;
  //     }

  //     // Extract the order details with product title and price from the result
  //     const orderDetails = {
  //       orderId: result[0]._id.toHexString(),
  //       deliveryDetails: result[0].deliveryDetails,
  //       payment: result[0].payment,
  //       totalAmount: result[0].totalAmount,
  //       status: result[0].status,
  //       date: result[0].date,
  //       products: result[0].products,
  //     };

  //     // Return the order details with product title and price
  //     return orderDetails;
  //   } catch (error) {
  //     // Handle any errors that occurred during the aggregation process
  //     console.error("Error fetching order details:", error);
  //     return null;
  //   }
  // },

  // Function to fetch order details with product title and price
  getOrderDetailsWithProduct: async (orderId) => {
    console.log("entered getOrderDetailsWithProduct", orderId);
    try {
      // Assuming you have access to the MongoDB client and the relevant collections

      // Convert the order ID from string to ObjectId
      const orderIdObj = new ObjectId(orderId);

      // Aggregation pipeline to fetch the order details with product title and price
      const pipeline = [
        // Match the order by ID
        {
          $match: {
            _id: orderIdObj,
          },
        },
        // Lookup to get product details based on the item IDs
        {
          $lookup: {
            from: "product",
            localField: "products.item",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        // Project to reshape the output
        {
          $project: {
            _id: 1,
            deliveryDetails: 1,
            payment: 1,
            totalAmount: 1,
            status: 1,
            date: 1,
            products: {
              $map: {
                input: "$products",
                as: "product",
                in: {
                  productId: "$$product.item",
                  quantity: "$$product.quantity",
                  productDetails: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$productDetails",
                          as: "pd",
                          cond: {
                            $eq: ["$$pd._id", "$$product.item"],
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },
      ];

      // Execute the aggregation pipeline
      const result = await db()
        .collection(collections.ORDER_COLLECTION)
        .aggregate(pipeline)
        .toArray();
      console.log("Execute the aggregation pipeline", result);

      // If order is not found, return null or handle the error accordingly
      if (result.length === 0) {
        return null;
      }

      // Extract the order details with product title and price from the result
      const orderDetails = {
        orderId: result[0]._id.toHexString(),
        deliveryDetails: result[0].deliveryDetails,
        payment: result[0].payment,
        totalAmount: result[0].totalAmount,
        status: result[0].status,
        date: result[0].date,
        products: result[0].products.map((product) => ({
          productId: product.productId.toHexString(),
          productName: product.productDetails.product_name,
          price: product.productDetails.price,
          quantity: product.quantity,
        })),
      };

      // Return the order details with product title and price
      return orderDetails;
    } catch (error) {
      // Handle any errors that occurred during the aggregation process
      console.error("Error fetching order details:", error);
      return null;
    }
  },

  fetchOrderDetailsWithProduct: async (orderId) => {
    console.log("entered to fetchOrderDetailsWithProduct", orderId);
    try {
      const pipeline = [
        // Match the order by ID
        {
          $match: {
            _id: new ObjectId(orderId),
          },
        },
        // Lookup to get user details
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        // Unwind the user array
        {
          $unwind: "$user",
        },
        // Lookup to get product details based on the item IDs
        {
          $lookup: {
            from: "product",
            localField: "products.item",
            foreignField: "_id",
            as: "productDetails",
          },
        },
      ];

      const result = await db()
        .collection(collections.ORDER_COLLECTION)
        .aggregate(pipeline)
        .toArray();

      if (result.length === 0) {
        // If order not found, return null or handle the error accordingly
        return null;
      }

      const orderDetails = {
        orderId: result[0]._id.toHexString(),
        deliveryDetails: result[0].deliveryDetails,
        payment: result[0].payment,
        totalAmount: result[0].totalAmount,
        status: result[0].status,
        date: result[0].date,
        user: {
          userId: result[0].user._id.toHexString(),
          username: result[0].user.username,
          email: result[0].user.email,
          phone: result[0].user.phone,
        },
        products: result[0].products.map((product) => {
          const matchedProduct = result[0].productDetails.find(
            (p) => p._id.toHexString() === product.item.toHexString()
          );
          return {
            productId: product.item.toHexString(),
            productName: matchedProduct.product_name,
            price: matchedProduct.price,
            quantity: product.quantity,
          };
        }),
      };

      return orderDetails;
    } catch (error) {
      // Handle any errors that occurred during the aggregation process
      console.error("Error fetching order details:", error);
      return null;
    }
  },

  getOrderListWithUserDetails: async () => {
    console.log("entered to ");
    try {
      const pipeline = [
        // Lookup to get user details
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        // Unwind the user array
        {
          $unwind: "$user",
        },
        // Project to reshape the output
        {
          $project: {
            orderId: "$_id",
            payment: 1,
            totalAmount: 1,
            status: 1,
            date: 1,
            username: "$user.username",
          },
        },
      ];

      const result = await db()
        .collection(collections.ORDER_COLLECTION)
        .aggregate(pipeline)
        .toArray();

      const orderList = result.map((order) => ({
        orderId: order.orderId.toHexString(),
        payment: order.payment,
        totalAmount: order.totalAmount,
        status: order.status,
        date: order.date,
        username: order.username,
      }));

      return orderList;
    } catch (error) {
      // Handle any errors that occurred during the aggregation process
      console.error("Error fetching order list:", error);
      return [];
    }
  },

  updateStatus: (orderId, body) => {
    console.log("entered to update status");
    console.log("req.body.status", body.status);
    return new Promise(async (resolve, reject) => {
      let updateStatus = await db()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: new ObjectId(orderId) },
          { $set: { status: body.status } }
        )

        .then((response) => {
          resolve(response);
        });
    });
  },
};
