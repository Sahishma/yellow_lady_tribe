var express = require("express");
var router = express.Router();
const adminHelpers = require("../helpers/admin-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const orderHelpers = require("../helpers/order-helpers");
const { db } = require("../config/connection");
const collections = require("../config/collections");
const { response } = require("../app");
const ObjectId = require("mongodb").ObjectId;

const verifyLogin = (req, res, next) => {
  // next();
  if (req.session.admin) {
    if (req.session.admin.loggedIn) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  } else {
    res.redirect("/admin/login");
  }
};

/* GET admin listing. */

router.get("/", verifyLogin, function (req, res, next) {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  // res.render("admin/index");
  res.render("admin/dashboard");
});

/* Login */

router.get("/login", (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin");
  } else {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.render("admin/login", {
      loginErr: req.session.adminLoginErr,
      layout: false,
    });
    req.session.adminLoginErr = false;
  }
});
router.post("/login", (req, res) => {
  adminHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      req.session.admin.loggedIn = true;
      res.redirect("/admin");
    } else {
      req.session.adminLoginErr = "Invalid User name or Password";
      res.redirect("/admin/login");
    }
  });
});

//logout
router.get("/logout", verifyLogin, (req, res) => {
  req.session.admin = null;
  res.redirect("/admin/login");
});

//--------------------------CATEGORY SECTION--------------------------//

router.get("/categories", verifyLogin, async (req, res) => {
  const categories = await db().collection("category").find().toArray();
  res.render("admin/categories/view-categories", {
    categories,
    successMsg: req.session.adminSuccessMsg,
  });
  req.session.adminSuccessMsg = false;
});

//add category

router.get("/categories/add", verifyLogin, (req, res) => {
  res.render("admin/categories/add");
});

router.post("/categories/add", verifyLogin, (req, res) => {
  categoryHelpers.addCategory(req.body, (insertedId) => {
    req.session.adminSuccessMsg = "Successfully Added";
    res.redirect("/admin/categories");
  });
});

//Edit Category

router.get("/categories/edit-categories/:id", verifyLogin, (req, res) => {
  const categoryId = req.params.id;
  categoryHelpers.getCategoryById(categoryId, (category) => {
    res.render("admin/categories/edit-categories", { category: category });
  });
});

// Update Category

router.post("/categories/edit-categories/:id", verifyLogin, (req, res) => {
  const categoryid = req.params.id; // get the ID of the category to edit from the URL
  const updatedCategory = {
    // define the updatedCategory object with the new values from the form
    category_name: req.body.category_name,
  };
  categoryHelpers.updateCategory(
    categoryid,
    updatedCategory,
    (updatedCategory, error) => {
      if (error) {
        res.status(500).send(error);
      } else {
        req.session.adminSuccessMsg = "Successfully updated";
        res.redirect("/admin/categories");
      }
    }
  );
});

// Delete category

router.get("/categories/delete-categories/:id", verifyLogin, (req, res) => {
  let categoryId = req.params.id;
  categoryHelpers.deleteCategory(categoryId).then((response) => {
    req.session.adminSuccessMsg = "Successfully Deleted";
    res.redirect("/admin/categories");
  });
});

//------------------------PRODUCTS SECTION-------------------------//

router.get("/products", verifyLogin, async (req, res) => {
  productHelpers.getAllProducts().then((products) => {
    console.log("products:::::", products);
    res.render("admin/products/view-products", {
      products,
      successMsg: req.session.adminSuccessMsg,
    });
    req.session.adminSuccessMsg = false;
  });
});

//add products
router.get("/products/add-products", verifyLogin, async (req, res) => {
  const categories = await db().collection("category").find().toArray();
  res.render("admin/products/add-products", { categories });
});

router.post("/products/add-products", verifyLogin, (req, res) => {
  productHelpers.addproduct(req.body, (insertedId) => {
    let image = req.files.image;
    image.mv("./public/img/" + insertedId + ".jpg", (err, done) => {
      if (!err) {
        req.session.adminSuccessMsg = "Successfully Added";
        res.redirect("/admin/products");
      } else {
        console.log(err);
      }
    });
  });
});

// delete products

router.get("/products/delete-products/:id", verifyLogin, (req, res) => {
  let productId = req.params.id;
  productHelpers.deleteProduct(productId).then((response) => {
    req.session.adminSuccessMsg = "Successfully Deleted";
    res.redirect("/admin/products");
  });
});

// Edit product

router.get("/products/edit-products/:id", verifyLogin, async (req, res) => {
  const categories = await db().collection("category").find().toArray();
  let products = await productHelpers.getProductDetails(req.params.id);
  res.render("admin/products/edit-products", { products, categories });
});

router.post("/products/edit-products/:id", verifyLogin, (req, res) => {
  let id = req.params.id;
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    req.session.adminSuccessMsg = "Successfully updated";

    if (req.files && "image" in req.files) {
      let image = req.files.image;
      image.mv("./public/img/" + id + ".jpg");
    }

    res.redirect("/admin/products");
  });
});

//______________________Users Section______________________//

router.get("/user", verifyLogin, async (req, res) => {
  try {
    const users = await userHelpers.getAllUsers();
    res.render("admin/user/view-users", {
      users,
      successMsg: req.session.adminSuccessMsg,
    });
    req.session.adminSuccessMsg = false;
  } catch (error) {
    console.log(error);
  }
});

router.get("/user/block/:id", verifyLogin, async (req, res) => {
  try {
    const userId = req.params.id;
    await userHelpers.blockUser(userId);
    req.session.adminSuccessMsg = "User Blocked successfully";
    res.redirect("/admin/user");
  } catch (error) {
    console.log(error);
  }
});

router.get("/user/unblock/:id", verifyLogin, async (req, res) => {
  try {
    const userId = req.params.id;
    await userHelpers.unblockUser(userId);
    req.session.adminSuccessMsg = "User Unlocked successfully";
    res.redirect("/admin/user");
  } catch (error) {
    console.log(error);
  }
});

//___________________Order section__________________//

router.get("/orders", verifyLogin, async (req, res) => {
  let orders = await orderHelpers.getOrderListWithUserDetails();
  console.log("orders in admin=======>", orders);
  res.render("admin/orders/view-orders", { orders });
});

router.get("/view-order-products/:id", verifyLogin, async (req, res) => {
  console.log("hello entered to route ");
  let orderDetails = await orderHelpers.fetchOrderDetailsWithProduct(
    req.params.id
  );
  // let orderDetails = await orderHelpers.getOrderDetailsWithProduct(req.params.id);
  console.log("result orderDetails", orderDetails);
  res.render("admin/orders/view-order-products", {
    orderDetails,
    successMsg: req.session.adminSuccessMsg,
    errorMsg: req.session.adminErrorMsg,
  });
  req.session.adminSuccessMsg = false;
  req.session.adminErrorMsg = false;

});

router.post("/order/status-update/:id", async (req, res) => {
  const updateResult = await orderHelpers.updateStatus(req.params.id, req.body);
  console.log("updateResult", updateResult);
  if (updateResult.acknowledged == true) {
    req.session.adminSuccessMsg = "Status Updated Successfully";
  } else {
    req.session.adminErrorMsg = "Something went wrong";
  }

  res.redirect("/admin/view-order-products/" + req.params.id);
});

module.exports = router;
