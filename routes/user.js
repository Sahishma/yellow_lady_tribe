const express = require("express");
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-helpers");
const { db } = require("../config/connection");
const { response } = require("../app");
const router = express.Router();

const verifyLogin = (req, res, next) => {
  if(req.session.user){
  if (req.session.user.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
}else{
  res.redirect('/login');
}
};

/* GET home page. */

router.get("/", async (req, res) => {
  const products = await productHelpers.getAllProducts();
  const categories = await db().collection("category").find().toArray();

  let user = req.session.user; 
  let cartCount = null
  if(req.session.user){
   cartCount= await userHelpers.getCartCount(req.session.user._id)
  }
  res.render("user/index", {
    user,
    products,
    categories,
    layout: "userLayout",
    cartCount,
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

//---------------------CART--------------------------//

router.get("/cart", verifyLogin, async (req, res) => {
  try {
    // Call the 'getCartProducts' function
    let products = await userHelpers.getCartProducts(req.session.user._id);
    // console.log('##########',req.session.user._id);
    // Call the 'getTotalAmount' function
    let total = await userHelpers.getTotalAmount(req.session.user._id);
    // console.log('**********',req.session.user._id);
    res.render('user/cart', {
      loginErr: req.session.userLoginErr,
      layout: "userLayout",
      products,
     user: req.session.user._id,
      total
    });
  } catch (error) {
    // Handle any errors that occurred during the process
    console.error(error);
    res.render('error', { error });
  }
});



// router.get("/cart",verifyLogin,async(req,res)=>{
//   let products = await userHelpers.getCartProducts(req.session.user._id) 
//   let total=await userHelpers.getTotalAmount(req.session.user._id)
//   res.render('user/cart',{loginErr: req.session.userLoginErr,
//     layout: "userLayout",products,user:req.session.user})
// });
// adding products to db 

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  console.log("api call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  });
})
// incrementing and decrimenting quantity
router.post('/change-product-quantity',(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})


//-------------------Checkout----------------//

router.get('/checkout',verifyLogin,async(req,res)=>{
  console.log("get /checkout");
  console.log("user id from get /checkout",req.session.user._id);
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/checkout',{loginErr: req.session.userLoginErr,
    layout: "userLayout",user:req.session.user,total})
})

router.post('/checkout',async(req,res)=>{
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.checkOut(req.body,products,totalPrice).then((response)=>{
    console.log("is status is there in response ?  -------->",response);
    res.json({status:true})
  })
  console.log(req.body)
})

//_____________________orders_______________________//



router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user,layout:"userLayout"})
})

router.get('/orders',async(req,res)=>{
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  console.log("orders---------->",orders)
  res.render('user/orders',{user:req.session.user,layout:"userLayout",orders})
  
})

router.get('/view-order-products/:id',async(req,res)=>{
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,
    products,
    layout:"userLayout"
  })
})






//logout

router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});



module.exports = router;
