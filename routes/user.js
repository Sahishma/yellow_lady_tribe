const express = require("express");
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const orderHelpers = require("../helpers/order-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const { db } = require("../config/connection");
const { response } = require("../app");
const router = express.Router();

const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    if (req.session.user.loggedIn) {
      next();
    } else {
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */

router.get("/", async (req, res) => {
  // const products = await productHelpers.getAllProducts();
  const products = await productHelpers.getProductsByCategoryWithPagination('645a6beaa7c8141f1034a725', 0, 8);

  const categories = await categoryHelpers.getAllCategories();

  let user = req.session.user;
  console.log("user session details", user);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  res.render("user/index", {
    user,
    products,
    categories,
    layout: "userLayout",
    cartCount,
  });
});



const ITEMS_PER_PAGE = 8;
router.get("/products/:category_id", async (req, res) => {
  const category_id = req.params.category_id;
  const categories = await categoryHelpers.getAllCategories();
  const reqUrl = req.url;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let user = req.session.user;

  // Get the page number from the query parameters
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Get the total count of products in the category
  const totalCount = await productHelpers.getProductsCountByCategory(category_id);

  // Calculate the total number of pages
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Fetch the products for the current page
  const products = await productHelpers.getProductsByCategoryWithPagination(category_id, skip, ITEMS_PER_PAGE);

  res.render("user/list-products-by-category", {
    products,
    categories,
    reqUrl,
    user,
    layout: "userLayout",
    cartCount,
    category_id,
    pagination: {
      page,
      totalPages,
    },
  });
  req.session.adminSuccessMsg = false;
});


/* Register */

router.get("/register", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  }

  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.render("user/register", {
    userErr: req.session.userRegisterErr,
    layout: "userLayout",
    noNeedNav: true,
  });
  req.session.userRegisterErr = false;
});

router.post("/register", async (req, res) => {
  //check email exist or not
  const email = req.body.email;
  const getUserByEmail = await userHelpers.getUserByEmail(email);
  if (getUserByEmail != null) {
    req.session.userRegisterErr = "Entered Email already exist";
    return res.redirect("/register");
  }

  //check mobile exist or not
  const phoneNo = req.body.phone;
  const getUserByPhoneNo = await userHelpers.getUserByPhoneNo(phoneNo);
  if (getUserByPhoneNo != null) {
    req.session.userRegisterErr = "Entered Phone number already exist";
    return res.redirect("/register");
  }

  userHelpers.doRegister(req.body).then((response) => {
    req.session.user = response;
    req.session.user.username = req.body.username;
    req.session.user.loggedIn = true;
    res.redirect("/");
  });
});

/* Login */

router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.render("user/login", {
      userErrMsg: req.session.userErrMsg,
      layout: "userLayout",
      noNeedNav: true,
    });
    req.session.userErrMsg = false;
  }
});
router.post("/login", async (req, res) => {
  const username = req.body.email;
  // Check if the user is blocked
  const user = await userHelpers.getUserByUsername(username);
  if (user && user.status === true) {
    // User is blocked, return an appropriate response or error message
    req.session.userErrMsg = "Your account has been blocked.";
    return res.redirect("/login");
  }
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.user.loggedIn = true;
      res.redirect("/");
    } else {
      req.session.userErrMsg = "Invalid User name or Password";
      res.redirect("/login");
    }
  });
});

//----------------------OTP---------------------------//
router.get("/otp-login", (req, res) => {
  res.render("user/otp-login", {
    userErrMsg: req.session.userErrMsg,
    layout: "userLayout",
    noNeedNav: true,
  });
  req.session.userErrMsg = false;
});

router.post("/otp-login", async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const user = await userHelpers.getUserByPhoneNo(phoneNumber);

  if (user == null) {
    req.session.userErrMsg = "User not found with the entered mobile number";
    return res.redirect("/otp-login");
  }
  // console.log('USER DETAILS', user._id);
  let generateOtp = await userHelpers.generateUserLoginOtp(
    user._id,
    phoneNumber
  );
  // console.log("generateOtp",generateOtp);
  if (generateOtp.acknowledged) {
    req.session.userIdForOtpLogin = user._id;
    req.session.userSuccessMsg = "OTP sent to your mobile number";
    res.redirect("/otp-validate");
  }
});

router.get("/otp-validate", (req, res) => {
  console.log("hello otp validate");
  if (!req.session.userIdForOtpLogin) {
    res.redirect("/otp-login");
  }
  res.render("user/otp-validate", {
    userIdForOtpLogin: req.session.userIdForOtpLogin,
    layout: "userLayout",
    noNeedNav: true,
  });
  delete req.session.userIdForOtpLogin;
});

router.post("/otp-validate", async (req, res) => {
  console.log("otp validate post", req.body);
  const userId = req.body.user_id;
  const otp = req.body.otp;
  const otpValidate = await userHelpers.otpValidate(userId, otp);

  if (otpValidate.status) {
    req.session.user = otpValidate.user;
    req.session.user.loggedIn = true;
    res.redirect("/");
  } else {
    req.session.userErrMsg = "Invalid Otp";
    res.redirect("/otp-login");
  }
  // res.redirect("/");
});

//---------------------CART--------------------------//

router.get("/cart", verifyLogin, async (req, res) => {
  const categories = await categoryHelpers.getAllCategories();
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let user = req.session.user;
  try {
    let products = await userHelpers.getCartProducts(req.session.user._id);
    let total = 0;
    if (products.length > 0) {
      total = await userHelpers.getTotalAmount(req.session.user._id);
    }

    res.render("user/cart", {
      loginErr: req.session.userLoginErr,
      layout: "userLayout",
      products,
      categories,
      userId: req.session.user._id,
      total,
      user,
      cartCount,
    });
  } catch (error) {
    // Handle any errors that occurred during the process
    console.error(error);
    res.render("error", { error });
  }
});

//TODO : if user is not loged in then redirect to login

router.get("/add-to-cart/:id", (req, res) => {
  console.log("api call");
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});

// incrementing and decrimenting quantity
router.post("/change-product-quantity", verifyLogin, (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    console.log(req.body, req.body.user[0]);
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
});

// remove from cart

//-------------------Checkout----------------//

router.get("/checkout", verifyLogin, async (req, res) => {
  console.log("get /checkout");
  console.log("user id from get /checkout", req.session.user._id);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  const categories = await categoryHelpers.getAllCategories();
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  res.render("user/checkout", {
    loginErr: req.session.userLoginErr,
    layout: "userLayout",
    user: req.session.user,
    total,
    categories,
    cartCount,
  });
});

router.post("/checkout", verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId);
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
  userHelpers.checkOut(req.body, products, totalPrice).then((response) => {
    console.log("is status is there in response ?  -------->", response);
    req.session.orderPlacedSuccessMsg = "Order Placed Successfully";
    res.json({ status: true, orderId: response.insertedId });
  });
  console.log(req.body);
});

//_____________________orders_______________________//

router.get("/order-success", verifyLogin, (req, res) => {
  res.render("user/order-success", {
    user: req.session.user,
    layout: "userLayout",
  });
});

router.get("/orders", verifyLogin, async (req, res) => {
  const categories = await categoryHelpers.getAllCategories();
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  console.log("orders---------->", orders);
  res.render("user/orders", {
    user: req.session.user,
    layout: "userLayout",
    orders,
    categories,
    cartCount,
  });
});

router.get("/view-order-products/:id", verifyLogin, async (req, res) => {
  const categories = await categoryHelpers.getAllCategories();
  let orderDetails = await orderHelpers.getOrderDetailsWithProduct(
    req.params.id
  );
  console.log("result orderDetails", orderDetails);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let userDetails = req.session.user;
  res.render("user/view-order-products", {
    user: req.session.user,
    layout: "userLayout",
    userDetails,
    orderDetails,
    userSuccessMsg: req.session.orderPlacedSuccessMsg,
    categories,
    cartCount,
  });
  req.session.orderPlacedSuccessMsg = false;
});

//--------------------product detail---------------------------//

router.get("/product-detail/:id", async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id);
  // console.log("id passed in req params",req.params.id);
  res.render("user/product-detail", {
    layout: "userLayout",
    user: req.session.user,
    product,
  });
});

//logout

router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});

module.exports = router;
