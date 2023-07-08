const { db } = require("../config/connection");
const collections = require("../config/collections");
const moment = require("moment");
var ObjectId = require("mongodb").ObjectId;
const PDFDocument = require("pdfkit");

module.exports = {
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db()
        .collection(collections.ORDER_COLLECTION)
        .find()
        .sort({ date: -1 })
        .toArray();
      resolve(orders);
    });
  },
  getOrderDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      await db()
        .collection(collections.ORDER_COLLECTION)
        .findOne({ _id: new ObjectId(orderId) })
        .then((order) => {
          console.log("order here=========>", order);
          resolve(order);
        });
    });
  },

  getDeliveredOrderListWithUserDetails: async () => {
    try {
      const pipeline = [
        // Match orders with status "delivered"
        {
          $match: {
            status: "Delivered",
          },
        },
        {
          $sort: {
            date: -1,
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
        // Project to reshape the output
        {
          $project: {
            orderId: "$_id",
            payment: 1,
            totalAmount: 1,
            status: 1,
            username: "$user.username",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
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
        date: moment(order.date).format("MMM Do YY"),
        username: order.username,
      }));

      return orderList;
    } catch (error) {
      // Handle any errors that occurred during the aggregation process
      console.error("Error fetching order list:", error);
      return [];
    }
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
            couponDiscount: 1,
            amountPayable: 1,
            status: 1,
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
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
        couponDiscount: result[0].couponDiscount,
        amountPayable: result[0].amountPayable,
        status: result[0].status,
        date: moment(result[0].date).format("MMM Do YY"),
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
        date: moment(result[0].date).format("MMM Do YY"),
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
    try {
      const pipeline = [
        // Sort the orders in descending order based on the date
        {
          $sort: {
            date: -1,
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
        // Project to reshape the output
        {
          $project: {
            orderId: "$_id",
            payment: 1,
            totalAmount: 1,
            status: 1,
            username: "$user.username",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
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
        date: moment(order.date).format("MMM Do YY"),
        username: order.username,
      }));

      return orderList;
    } catch (error) {
      // Handle any errors that occurred during the aggregation process
      console.error("Error fetching order list:", error);
      return [];
    }
  },

  updateStatus: (orderId, status) => {
    return new Promise(async (resolve, reject) => {
      let updateStatus = await db()
        .collection(collections.ORDER_COLLECTION)
        .updateOne({ _id: new ObjectId(orderId) }, { $set: { status: status } })

        .then((response) => {
          resolve(response);
        });
    });
  },

  getSalesReport: async (startDate, endDate) => {
    try {
      // Convert start and end dates to MongoDB date format
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Query the database to fetch the sales data within the date range
      const salesData = await db()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              date: {
                $gte: start,
                $lte: end,
              },
              status: "Delivered",
            },
          },
          {
            $lookup: {
              from: collections.USER_COLLECTION,
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: "$user",
          },
          {
            $project: {
              orderId: "$_id",
              payment: 1,
              totalAmount: 1,
              status: 1,
              username: "$user.username",
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$date" },
              },
            },
          },
        ])
        .toArray();

      return salesData;
    } catch (error) {
      console.error("Error fetching sales data:", error);
      return [];
    }
  },

  generateSalesReportPdf: (salesData) => {
    // Create a new PDF document
    const doc = new PDFDocument();

    // Generate the sales report
    doc.fontSize(18).text("Sales Report", { align: "center" });
    doc.moveDown();

    // Iterate over the sales data and add it to the PDF
    salesData.forEach((sale, index) => {
      doc.text(`Order ID: ${sale.orderId}`);
      doc.text(`Date: ${sale.date}`);
      doc.text(`Customer: ${sale.username}`);
      doc.text(`Amount: ${sale.totalAmount}`);
      doc.text(`Payment Method: ${sale.payment}`);
      doc.text(`Status: ${sale.status}`);
      doc.moveDown();
    });

    // Finalize the PDF document
    doc.end();

    // Return the generated PDF buffer
    return doc;
  },

  generateSalesReportPdf2: (salesData) => {
    // Create a new PDF document
    const doc = new PDFDocument();

    // Generate the sales report
    doc.fontSize(18).text("Sales Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(10); 

    // Table headers
    const headers = [
      "Order ID",
      "Date",
      "Customer",
      "Amount",
      "Payment Method",
      "Status",
    ];

    // Table rows
    const tableRows = salesData.map((sale) => [
      sale.orderId,
      sale.date,
      sale.username,
      sale.totalAmount,
      sale.payment,
      sale.status,
    ]);

    // Set table width and position
    const tableWidth = 500;
    const tableHeight = 20;
    const tableX = (doc.page.width - tableWidth) / 2;
    const tableY = doc.y;

    // Draw table headers
    doc.font("Helvetica-Bold");
    headers.forEach((header, index) => {
      const headerX = tableX + (tableWidth / headers.length) * index;
      const headerY = tableY;
      doc.text(header, headerX, headerY, {
        width: tableWidth / headers.length,
        align: "center",
      });
    });

    doc.moveDown();

    // Draw table rows
    doc.font("Helvetica");
    tableRows.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        const cellX = tableX + (tableWidth / headers.length) * columnIndex;
        const cellY = tableY + tableHeight * (rowIndex + 1);
        doc.text(cell, cellX, cellY, {
          width: tableWidth / headers.length,
          align: "center",
        });
      });
    });

    // Finalize the PDF document
    doc.end();

    // Return the generated PDF buffer
    return doc;
  },

  getTodaysOrdersCount: async () => {
    try {
      // Get the current date
      const currentDate = new Date();

      // Set the start and end date for the current day
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      // Query the database to count the orders within the date range
      const count = await db()
        .collection(collections.ORDER_COLLECTION)
        .countDocuments({
          date: {
            $gte: startDate,
            $lt: endDate,
          },
          // Include an additional condition to match orders with the current day's date
          $expr: {
            $eq: [{ $dayOfMonth: "$date" }, { $dayOfMonth: currentDate }],
          },
        });

      return count;
    } catch (error) {
      console.error("Error fetching today's orders count:", error);
      return 0;
    }
  },

  getTodaysTotalSales: async () => {
    try {
      // Get the current date
      const currentDate = new Date();

      // Set the start and end date for the current day
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      // Query the database to calculate the total sale amount within the date range
      const sales = await db()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              date: {
                $gte: startDate,
                $lt: endDate,
              },
              // Include an additional condition to match orders with the current day's date
              $expr: {
                $eq: [{ $dayOfMonth: "$date" }, { $dayOfMonth: currentDate }],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$totalAmount" },
            },
          },
        ])
        .toArray();

      // Extract the totalAmount from the result
      const todaysTotalSale = sales.length > 0 ? sales[0].totalAmount : 0;

      return todaysTotalSale;
    } catch (error) {
      console.error("Error fetching today's total sales amount:", error);
      return 0;
    }
  },

  getTotalOrders: async () => {
    try {
      const count = await db()
        .collection(collections.ORDER_COLLECTION)
        .countDocuments();
      return count;
    } catch (error) {
      console.error("Error fetching total orders count:", error);
      return 0;
    }
  },

  getTotalSales: async () => {
    try {
      const pipeline = [
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ];

      const result = await db()
        .collection(collections.ORDER_COLLECTION)
        .aggregate(pipeline)
        .toArray();

      if (result.length > 0) {
        return result[0].totalAmount;
      } else {
        return 0;
      }
    } catch (error) {
      console.error("Error fetching total sales amount:", error);
      return 0;
    }
  },

  // getOrderLineChartData: async()=>{
  //   try {
  //     // Get the current date
  //     const currentDate = new Date();

  //     // Create an array to store the labels (last 7 dates)
  //     const labels = [];

  //     // Create an array to store the data (number of orders per day)
  //     const data = [];

  //     // Loop through the past 7 days
  //     for (let i = 6; i >= 0; i--) {
  //       // Calculate the date by subtracting the number of days
  //       const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i);

  //       // Format the date to match the database date format (e.g., YYYY-MM-DD)
  //       const formattedDate = date.toISOString().split("T")[0];

  //       // Query the database to count the orders matching the current date
  //       const count = await db()
  //         .collection(collections.ORDER_COLLECTION)
  //         .countDocuments({ "date.$date": formattedDate });

  //       // Add the formatted date to the labels array
  //       labels.push(formattedDate);

  //       // Add the order count to the data array
  //       data.push(count);
  //     }

  //      // Add today's date
  //      const todayFormattedDate = currentDate.toISOString().split("T")[0];
  //      labels.push(todayFormattedDate);
  //      const todayCount = await db()
  //        .collection(collections.ORDER_COLLECTION)
  //        .countDocuments({ "date.$date": todayFormattedDate });
  //      data.push(todayCount);

  //     // Return an object containing the labels and data arrays
  //     return { labels, data };
  //   } catch (error) {
  //     console.error("Error fetching order chart data:", error);
  //     return { labels: [], data: [] };
  //   }
  // },

  getOrderLineChartData: async () => {
    var currentDate = new Date();
    var labels = [];
    var data = [];

    for (var i = 6; i >= 0; i--) {
      var date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      labels.push(formatDate(date));
      data.push(0); // Initialize the order count for each day as 0
    }

    await db()
      .collection(collections.ORDER_COLLECTION)
      .aggregate([
        {
          $match: {
            date: {
              $gte: new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate()
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .forEach(function (doc) {
        var index = labels.indexOf(doc._id);
        if (index !== -1) {
          data[index] = doc.count;
        }
      });

    return {
      labels: labels,
      data: data,
    };
  },

  // Assuming you have an Order model defined and connected to the database

  getorderBarChartData: async () => {
    try {
      const orderStatusData = await db()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();


      const labels = [];
      const data = [];

      orderStatusData.forEach((statusData) => {
        labels.push(statusData._id);
        data.push(statusData.count);
      });

      return {
        labels,
        data,
      };
    } catch (error) {
      console.error("Error fetching order status data:", error);
      throw error;
    }
  },
};

function formatDate(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}
