const express = require("express");
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const orderHelpers = require("../helpers/order-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const { db } = require("../config/connection");
const { response } = require("../app");
const couponHelpers = require("../helpers/coupon-helpers");
const addressHelpers = require("../helpers/address-helpers");
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
  const products = await productHelpers.getProductsByCategoryWithPagination(
    "645a6beaa7c8141f1034a725",
    0,
    8
  );
  console.log("products in index", products);
  const categories = await categoryHelpers.getAllCategories();

  let user = req.session.user;
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
  const totalCount = await productHelpers.getProductsCountByCategory(
    category_id
  );

  // Calculate the total number of pages
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Fetch the products for the current page
  const products = await productHelpers.getProductsByCategoryWithPagination(
    category_id,
    skip,
    ITEMS_PER_PAGE
  );
  console.log("list-products-by-category PRODUCTS", products);

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
  // const allCoupens = await couponHelpers.getAllCoupons();
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
router.get("/check-login", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});
router.post("/login", (req, res) => {
  // After successful login, redirect to home page
  res.redirect("/");
});
router.get("/add-to-cart/:id", (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});
// incrementing and decrimenting quantity
router.post("/change-product-quantity", verifyLogin, (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    console.log("changeProductQuantity",response);
    response.total = await userHelpers.getTotalAmount(req.body.user);
    console.log("total",response.total);
    res.json(response);
  });
});

// remove from cart
router.get("/cart/remove-cart-item/:id", verifyLogin, (req, res) => {
  let itemId = req.params.id;
  let userId = req.session.user._id;
  userHelpers.removeProduct(userId, itemId).then((response) => {
    res.redirect("/cart");
  });
});

//-------------------Checkout----------------//

router.get("/checkout", verifyLogin, async (req, res) => {
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  const categories = await categoryHelpers.getAllCategories();
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  let addresses = await addressHelpers.getAllAddress(req.session.user._id)
  console.log("req.session.user",req.session.user);
  console.log("adresses",addresses);
  res.render("user/checkout", {
    loginErr: req.session.userLoginErr,
    layout: "userLayout",
    user: req.session.user,
    total,
    categories,
    cartCount,
    addresses,
  });
});

router.post("/checkout", verifyLogin, async (req, res) => {
  console.log("REQ.BODY ::|>", req.body);
  let products = await userHelpers.getCartProductList(req.body.userId);
  console.log("previous products in cart", products);

  let totalPrice = await userHelpers.getTotalAmount(req.body.userId);

  let cartProducts = await productHelpers.getCartProducts(req.body.userId);
  console.log("new products in cart====>", cartProducts);

  // Call checkOut to process the checkout
  userHelpers.checkOut(req.body, products, totalPrice).then((orderId) => {
    console.log("products after updating STOCK::", products);
    if (req.body["payment"] == "COD") {
      req.session.orderPlacedSuccessMsg = "Order Placed Successfully";
      res.json({ codSuccess: true, orderId }); // Respond with JSON indicating COD payment success
    } else {
      userHelpers
        .generateRazorpay(orderId, parseInt(req.body.amount_payable_input))
        .then((response) => {
          res.json(response);
        });
    }
  });
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
  console.log("orders to check id [[[[[[[]]]]]]]]]]", orders);
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

router.get("/return-order/:id", verifyLogin, async (req, res) => {
  const status = "Returned";
  const updateStatus = await orderHelpers.updateStatus(req.params.id, status);
  console.log("updateStatus", updateStatus);
  if (updateStatus.acknowledged == true) {
    req.session.userSuccessMsg = "Order Returned";
  } else {
    req.session.userErrorMsg = "Something went wrong";
  }
  res.redirect("/view-order-products/" + req.params.id);
});

router.get("/cancel-order/:id", verifyLogin, async (req, res) => {
  const status = "Cancelled";
  const updateStatus = await orderHelpers.updateStatus(req.params.id, status);
  console.log("updateStatus", updateStatus);
  if (updateStatus.acknowledged == true) {
    req.session.userSuccessMsg = "Order Cancelled";
  } else {
    req.session.userErrorMsg = "Something went wrong";
  }

  res.redirect("/view-order-products/" + req.params.id);
});

router.post("/verify-payment", (req, res) => {
  console.log("in verify payment", req.body);
});

//--------------------product detail---------------------------//

router.get("/product-detail/:slug", async (req, res) => {
  console.log("req.params.slug", req.params.slug);
  const categories = await categoryHelpers.getAllCategories();
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let product = await productHelpers.getProductDetails(req.params.slug);
  console.log("slug in get ==========>", product.slug);
  res.render("user/product-detail", {
    layout: "userLayout",
    user: req.session.user,
    product,
    cartCount,
    categories,
  });
});

//-----------------Search-----------------------------//

router.get("/search", async (req, res) => {
  const categories = await categoryHelpers.getAllCategories();

  const query = req.query.query;

  // Get the page number from the query parameters
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Get the total count of products
  const totalCount = await productHelpers.getProductsCountBySearchQuery(query);

  // Calculate the total number of pages
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const searchResults = await productHelpers.getBySearchQuery(
    query,
    skip,
    ITEMS_PER_PAGE
  );

  res.render("user/search-results", {
    query,
    searchResults,
    categories,
    layout: "userLayout",
    pagination: {
      page,
      totalPages,
    },
  });
});

//-----------------------------Coupon--------------------------//

router.post("/apply-coupon", verifyLogin, async (req, res) => {
  couponFromUser = req.body.couponCode;
  const coupon = await couponHelpers.checkCouponValid(couponFromUser);
  if (coupon == null) {
    res.json({
      status: "failure",
      message: "************Invalid coupon************",
    });
  } else {
    let total = await userHelpers.getTotalAmount(req.session.user._id);
    let couponDiscount = coupon.value;
    let amountPayable = total - coupon.value;
    res.json({
      status: "success",
      message: "************Coupon applied************",
      total,
      amountPayable,
      couponDiscount,
    });
  }
});

//......................Banners.............//

//----------Profile------------//

router.get("/profile",verifyLogin, async (req, res) => {
  console.log("hi profile");
   console.log("req.session.user._id",req.session.user._id);
  const user = await userHelpers.getUserDetails(req.session.user._id);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  const categories = await categoryHelpers.getAllCategories();
  console.log("user", user);
  res.render("user/profile", { layout: "userLayout", user,cartCount,categories });
});

//---Saved Addresses
router.get("/saved-addresses", verifyLogin, async (req, res) => {
  try {
    const allAddress = await addressHelpers.getAllAddress(req.session.user._id);

    // Sort addresses with the default address at the beginning
    const sortedAddresses = allAddress.sort((a, b) => {
      if (a.default_address && !b.default_address) {
        return -1; // a is default address, so it comes first
      } else if (!a.default_address && b.default_address) {
        return 1; // b is default address, so it comes first
      } else {
        return 0; // both addresses have the same default_address value, maintain the original order
      }
    });

    let cartCount = null;
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }

    const categories = await categoryHelpers.getAllCategories();

    res.render("user/address/saved-addresses", {
      layout: "userLayout",
      allAddress: sortedAddresses,
      cartCount,
      categories,
      user: req.session.user,
    });
  } catch (error) {
    console.log(error);
    // Handle any errors that occur during fetching addresses
    res.render("error", { error });
  }
});

// add address
router.get("/address/add",verifyLogin,(req,res)=>{
  
  res.render("user/address/add",{
    layout: "userLayout",
    user: req.session.user,
    successMsg: req.session.userSuccessMsg,
    errorMsg: req.session.userErrorMsg,
  })
  req.session.userSuccessMsg = false,
  req.session.userErrorMsg  = false;
})
router.post("/address/add",verifyLogin,async(req,res)=>{
  console.log('add address',req.body);

  if (req.body.default_address === "on") {
    await addressHelpers.unmarkDefaultAddress(req.session.user._id);
  }

   const newAddress = await addressHelpers.addAddress(req.body);
   console.log("newAddress",newAddress);
   if (newAddress.acknowledged == true) {
    req.session.userSuccessMsg  = "Address Added Successfully";
  } else {
    req.session.userErrorMsg = "Something went wrong";
  }
   res.redirect("/address/add")
})

//---Edit Address
router.get("/address/edit/:id",async(req,res)=>{
  console.log("hello edit address");
  let addressDetail  = await addressHelpers.getAddressDetail(req.params.id)
  console.log("addressDetail",addressDetail);
  res.render("user/address/edit",{
    layout: "userLayout",
    addressDetail,
    user: req.session.user,
  })
})

router.get("/address/get_json/:id",async(req,res)=>{
  console.log("hello edit address");
  let addressDetail  = await addressHelpers.getAddressDetail(req.params.id)
  console.log("addressDetail",addressDetail);
  res.json({addressDetail});
})

router.post("/address/edit/:id",async(req,res)=>{
  console.log("hello edit post");
  let updateAddress = await addressHelpers.updateAddress(req.params.id,req.body)
  console.log("updateAddress",updateAddress);
  res.redirect("/address/edit/"+req.params.id)
})

//---delete

router.get("/address/delete/:id",async(req,res)=>{
  console.log("hello address delete",req.params.id);
  let deleteAddress = await addressHelpers.deleteAddress(req.params.id)
  console.log("deleteAddress",deleteAddress);
  res.redirect("/saved-addresses")
})






//---edit..

router.get("/edit-profile", verifyLogin, async (req, res) => {
  console.log("hi edit");
  try {
    const user = await userHelpers.getUserDetails(req.session.user._id);
    const address = await addressHelpers.getDefaultAddress(req.session.user._id);
    const categories = await categoryHelpers.getAllCategories();
    let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
    console.log("address",address);
    res.render("user/edit-profile", {
      layout: "userLayout",
      user,
      address,
      categories,
      cartCount,
      successMsg: req.session.userSuccessMsg,
      errorMsg: req.session.userErrorMsg,
    });
    req.session.userSuccessMsg = false;
    req.session.userErrorMsg = false;
  } catch (error) {
    console.log(error);
    // Handle any errors that occur during fetching user details
    res.render("error", { error });
  }
});


router.post("/edit-profile", verifyLogin, async (req, res) => {
  console.log("hi edit post");
  const updatedProfile = await userHelpers.updateProfile(req.session.user._id, req.body);
  console.log("updatedProfile", updatedProfile);
  // Handle the response or redirect to a success page
  if (updatedProfile.acknowledged == true) {
    req.session.userSuccessMsg  = "Profile Updated Successfully";
  } else {
    req.session.userErrorMsg = "Something went wrong";
  }
  res.redirect("/edit-profile");
  
});

//------------404------------------//

router.get("/404",(req,res)=>{
  res.render("404",{layout: "userLayout"})
})

//logout

router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});

module.exports = router;
