const express = require("express");
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const { db } = require("../config/connection");
const router = express.Router();

const verifyLogin = (req, res, next) => {
  if (req.session.user.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */

router.get("/", async (req, res) => {
  const products = await productHelpers.getAllProducts();
  const categories = await db().collection("category").find().toArray();

  let user = req.session.user; // is user logged in? if yes,session will store the details
  res.render("user/index", {
    user,
    products,
    categories,
    layout: "userLayout",
  });
});

router.get("/products/:category_id", async (req, res) => {
  const category_id = req.params.category_id;
  console.log('category id received from href', category_id);
  const categories = await db().collection("category").find().toArray();
  const reqUrl= req.url;

  productHelpers.getProductsByCategory(category_id).then((products) => {
    console.log('prodets fetched ', products);
    res.render("user/list-products-by-category", { products, categories, reqUrl,  layout: "userLayout", });
    req.session.adminSuccessMsg = false;
  });
});

/* Register */

router.get("/register", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  }
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.render("user/register", { layout: "userLayout", noNeedNav: true });
});

router.post("/register", async (req, res) => {
  const email = req.body.email;
  console.log("body.email---------------->>>>", email);
  const existingData = await userHelpers.getUserByEmail(email);
  console.log("email from getuserbyemail to user.js", email);
  console.log("existingEmail------------->>>>", existingData.email);
  if (existingData.email === email) {
    console.log(
      "<<<<<<<<<<<<<<<<<<  Entered to if condition >>>>>>>>>>>>>>>>>>"
    );
    req.session.registrationErr = "Entered Email Alredy Registered";
    return res.redirect("/register");
  }

  // const phoneNo = req.body.phone
  // console.log("body.PhoneNumber---------------->>>>",phoneNo);
  // const existingDetails = await userHelpers.getUserByNumber(phoneNo);
  // console.log("phoneNumber from getuserbyNumber to user.js",phoneNo);
  // console.log("existingNumber------------->>>>",existingDetails.phoneNo);
  // if(existingDetails.phone == phoneNo){
  //   console.log("<<<<<<<<<<<<<<<<<<  Entered to if condition in phoneNumber case >>>>>>>>>>>>>>>>>>");
  //   req.session.registrationErr = "Entered Phone Number Alredy Registered";
  // }

  userHelpers.doRegister(req.body).then((response) => {
    req.session.user = response;
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
      loginErr: req.session.userLoginErr,
      layout: "userLayout",
      noNeedNav: true,
    });
    req.session.userLoginErr = false;
  }
});
router.post("/login", async (req, res) => {
  const username = req.body.email;
  // Check if the user is blocked
  const user = await userHelpers.getUserByUsername(username);
  if (user && user.status === true) {
    // User is blocked, return an appropriate response or error message
    req.session.userLoginErr = "Your account has been blocked.";
    return res.redirect("/login");
  }
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.user.loggedIn = true;
      res.redirect("/");
    } else {
      req.session.userLoginErr = "Invalid User name or Password";
      res.redirect("/login");
    }
  });
});

//logout

router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});



module.exports = router;
