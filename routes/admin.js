var express = require("express");
var router = express.Router();
const adminHelpers = require("../helpers/admin-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const orderHelpers = require("../helpers/order-helpers");
const couponHelpers = require("../helpers/coupon-helpers");
const bannerHelpers = require("../helpers/banner-helpers");
const { db } = require("../config/connection");
const collections = require("../config/collections");
const { response } = require("../app");
const path = require("path");
const multer = require("multer");
const ObjectId = require("mongodb").ObjectId;
const fs = require('fs');


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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/img"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

// Set up Multer storage configuration for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/product/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Set up Multer storage configuration for category images
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/category/");
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});
// Create Multer upload instances for product and category images
const uploadProduct = multer({ storage: productStorage });
const uploadCategory = multer({ storage: categoryStorage });

// Create multer upload middleware
const img = multer({ storage: storage });

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

router.get("/categories", async (req, res) => {
  const categories = await db().collection("category").find().toArray();
  res.render("admin/categories/view-categories", {
    categories,
    successMsg: req.session.adminSuccessMsg,
    errorMsg: req.session.adminErrMsg,
  });
  req.session.adminSuccessMsg = false;
  req.session.adminErrMsg = false;
});

//add category

router.get("/categories/add", (req, res) => {
  res.render("admin/categories/add", {
    errorMsg: req.session.adminErrorMsg,
  });
  req.session.adminErrorMsg = false;
});

router.post("/categories/add", async (req, res) => {
  console.log('req.body in add', req.body);
  const existingCategory = await categoryHelpers.getcategoryByName(req.body);
  console.log('existingCategory', existingCategory);

  if (existingCategory === null) {
    categoryHelpers.addCategory(req.body, (insertedId) => {
      console.log("files________.", req.files);
      let image = req.files.image;
      image.mv("./public/img/category/" + insertedId + ".jpg", (err, done) => {
        if (!err) {
          req.session.adminSuccessMsg = "Successfully Added";
          res.redirect("/admin/categories");
        } else {
          console.log("error while updating img", err);
        }
      });
    });
  } else {
    req.session.adminErrorMsg = "Category already exists";
    res.redirect("/admin/categories/add");
  }
});

//Edit Category
//TODO verifylogin
router.get("/categories/edit-categories/:id", (req, res) => {
  const categoryId = req.params.id;
  categoryHelpers.getCategoryById(categoryId, (category) => {
    res.render("admin/categories/edit-categories", {
      category: category,
      errorMsg: req.session.adminErrorMsg,
      successMsg: req.session.adminSuccessMsg,
    });
    req.session.adminErrorMsg = false;
    req.session.adminSuccessMsg = false;
  });
});

// Update Category

router.post("/categories/edit-categories/:id", uploadCategory.single("imageUploded"), async (req, res) => {
  console.log('category edit body', req.body);

  const categoryId = req.params.id; // get the ID of the category to edit from the URL
  const existingCategory = await categoryHelpers.getcategoryByNameAndId(req.body, categoryId);
  console.log("existingCategory==>", existingCategory);

  if (existingCategory && categoryId != null) {
    req.session.adminErrorMsg = "Category already exists";
    return res.redirect("/admin/categories/edit-categories/" + categoryId);
  }

  const dataToUpdate = {
    ...req.body
  };

  let strippedRelativeImagePath = req.body.image_url;

  if (req.file) {
    // Get the relative path of the uploaded image
    const relativeImagePath = req.file.path;
    strippedRelativeImagePath = relativeImagePath.replace('public', '');

    const oldImagePath = 'public/'+ req.body.image_url;
    if (oldImagePath) {
      const oldImageFilePath = path.join(__dirname, '../', oldImagePath);
      fs.unlink(oldImageFilePath, (error) => {
        if (error) {
          console.log('Error deleting old image file:', error);
        } else {
          console.log('Old image file deleted:', oldImageFilePath);
        }
      });
    }
  }

  dataToUpdate.image_url = strippedRelativeImagePath


  try {
    await categoryHelpers.updateCategory(categoryId, dataToUpdate);
    req.session.adminSuccessMsg = "Successfully updated";
    res.redirect("/admin/categories/edit-categories/" + categoryId);
  } catch (error) {
    req.session.adminErrorMsg = "Error updating category.";
    res.redirect("/admin/categories/edit-categories/" + categoryId);
  }
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
const getProduct = async (req, res) => {
  productHelpers.getAllProducts().then((products) => {
    res.render("admin/products/view-products", {
      products,
      successMsg: req.session.adminSuccessMsg,
      adminErrMsg: req.session.adminErrMsg,
    });
    req.session.adminSuccessMsg = false;
    req.session.adminErrMsg = false;
  });
};
router.get("/products", verifyLogin, getProduct);

//add products
router.get("/products/add-products", verifyLogin, async (req, res) => {
  const categories = await categoryHelpers.getAllCategories();
  res.render("admin/products/add-products", {
    categories,
    adminErrMsg: req.session.adminErrMsg,
  });
  req.session.adminErrMsg = false;
});

router.post(
  "/products/add-products",
  img.array("image", 5),
  verifyLogin,
  async (req, res) => {
    const slug = req.body.slug;
    const existingSlug = await productHelpers.getProductsBySlug(slug);

    if (existingSlug) {
      req.session.adminErrMsg = "Product with the same slug already exists";
      return res.redirect("/admin/products/add-products");
    } else if (existingSlug == null) {
      try {
        productHelpers.addproduct(req.body);

        req.session.adminSuccessMsg = "Successfully Added";
        res.redirect("/admin/products");
      } catch (error) {
        console.log(error);
      }
    }
  }
);

// delete products

router.get("/products/delete-products/:id", verifyLogin, async (req, res) => {
  let productId = req.params.id;
  await productHelpers.deleteProduct(productId).then((response) => {
    req.session.adminSuccessMsg = "Successfully Deleted";
    res.redirect("/admin/products");
  });
});

// Edit product

router.get("/products/edit-products/:id", verifyLogin, async (req, res) => {
  const categories = await db().collection("category").find().toArray();
  let products = await productHelpers.getProductDetailsById(req.params.id);
  res.render("admin/products/edit-products", { products, categories });
});

router.post("/products/edit-products/:id", verifyLogin, async (req, res) => {
  const id = req.params.id;
  const slug = req.body.slug;
  console.log("id", id, "slug", slug);
  const existingSlug = await productHelpers.getProductsBySlug(slug, id);
  if (existingSlug) {
    req.session.adminErrMsg = "Procuct with the same slug already exists";
    return res.redirect("/admin/products/edit-products/" + req.params.id);
  }
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    req.session.adminSuccessMsg = "Successfully updated";

    if (req.files && "image" in req.files) {
      let image = req.files.image;
      image.mv("./public/img/" + id + ".jpg");
    }

    res.redirect("/admin/products");
  });
});

// router.post("/categories/edit-categories/:id", verifyLogin, async (req, res) => {
//   try {
//     const categoryid = req.params.id; // get the ID of the category to edit from the URL
//     const updatedCategory = { category_name: req.body.category_name };

//     const result = await categoryHelpers.updateCategory(categoryid, updatedCategory);

//     if (result) {
//       req.session.adminSuccessMsg = "Successfully updated";

//       if (req.files && "image" in req.files) {
//         let image = req.files.image;
//         image.mv("./public/img/" + categoryid + ".jpg");
//       }

//       res.redirect("/admin/categories");
//     } else {
//       res.status(404).send("Category not found");
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).send(error);
//   }
// });

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
  const status = req.body.status;
  const updateResult = await orderHelpers.updateStatus(req.params.id, status);
  console.log("updateResult", updateResult);
  if (updateResult.acknowledged == true) {
    req.session.adminSuccessMsg = "Status Updated Successfully";
  } else {
    req.session.adminErrorMsg = "Something went wrong";
  }

  res.redirect("/admin/view-order-products/" + req.params.id);
});

//______________coupon_________________//
const getCoupon = async (req, res) => {
  let getCoupons = await couponHelpers.getAllCoupons();
  res.render("admin/coupons/coupons", {
    successMsg: req.session.adminSuccessMsg,
    getCoupons,
    adminErr: req.session.adminCouponErr,
  });
  req.session.adminSuccessMsg = false;
  req.session.adminCouponErr = false;
};
router.get("/coupons", verifyLogin, getCoupon);

//......add

// router.get("/coupons/add", (req, res) => {
//   console.log("add coupon");
//   res.render("admin/coupons/add", {
//     adminErr: req.session.adminCouponErr,
//   });
//   req.session.adminCouponErr = false;
// });
// router.post("/coupons/add", async (req, res) => {
//   //check coupon exist or not
//   const couponCode = req.body.coupon_code;
//   console.log("coupon code from body========>",req.body.coupon_code);
//   const getCouponByCouponCode = await couponHelpers.getCouponByCouponCode(couponCode);
//   console.log("getCouponByCouponCode========>",getCouponByCouponCode);
//   if (getCouponByCouponCode != null) {
//     req.session.adminCouponErr = "Entered coupon already exist";
//   }
//   try {
//     couponHelpers.addCoupon(req.body);
//     req.session.adminSuccessMsg = "Coupon added succesfully";
//     res.redirect("/admin/coupons");
//   } catch (error) {
//     console.log(error);
//   }
// });

router.get("/coupons/add", verifyLogin, (req, res) => {
  console.log("add coupon");
  res.render("admin/coupons/add", { errorMsg: req.session.adminCouponErr });
  req.session.adminCouponErr = false;
});
router.post("/coupons/add", async (req, res) => {
  //check coupon exist or not
  const slug = req.body.slug;
  const existingCoupon = await couponHelpers.getCouponBySlug(slug);
  if (existingCoupon) {
    req.session.adminCouponErr = "Coupon with the same slug already exists";
    return res.redirect("/admin/coupons/add");
  }

  const couponCode = req.body.coupon_code;
  const getCouponByCouponCode = await couponHelpers.getCouponByCouponCode(
    couponCode
  );
  if (getCouponByCouponCode === null) {
    try {
      await couponHelpers.addCoupon(req.body);
      req.session.adminSuccessMsg = "Coupon added succesfully";
      res.redirect("/admin/coupons");
    } catch (error) {
      console.log(error);
    }
  } else {
    // Coupon already exists
    req.session.adminCouponErr = "Entered coupon already exists";
    res.redirect("/admin/coupons/add");
  }
});

//......Edit
router.get("/coupons/edit/:id", verifyLogin, async (req, res) => {
  console.log("hllo edit coupon", req.params.id);

  let coupon = await couponHelpers.getCouponDetails(req.params.id);
  console.log("edit coupon ---------->>>>>>>>>>", coupon);
  res.render("admin/coupons/edit", {
    coupon,
    errorMsg: req.session.adminCouponErr,
  });
  req.session.adminCouponErr = false;
});

router.post("/coupons/edit/:id", async (req, res) => {
  console.log("post edit");
  console.log(req.body);
  // coupon exist or not

  const slug = req.body.slug;
  const couponId = req.params.id;
  const existingCoupon = await couponHelpers.getCouponBySlug(slug, couponId);
  if (existingCoupon) {
    req.session.adminCouponErr = "Coupon with the same slug already exists";
    return res.redirect("/admin/coupons/edit/" + req.params.id);
  }

  const couponCode = req.body.coupon_code;
  console.log("coupon code", req.body.coupon_code);
  const id = req.params.id;
  let coupon = await couponHelpers.getCouponByCouponCode(couponCode, id);
  console.log("coupen fetch from db", coupon);
  if (coupon && id != null) {
    req.session.adminCouponErr = "Coupon already exist";
    return res.redirect("/admin/coupons/edit/" + req.params.id);
  }
  couponHelpers.updateCoupon(req.params.id, req.body).then(response);
  req.session.adminSuccessMsg = "Coupon Updated Successfully";
  res.redirect("/admin/coupons");
});

//.....Delete

router.get("/coupons/delete/:id", verifyLogin, (req, res) => {
  console.log("delete copoun");
  couponHelpers.deleteCoupon(req.params.id).then(response);
  req.session.adminSuccessMsg = "Successfully Deleted";
  res.redirect("/admin/coupons");
});

//----------------Banner-------------//

router.get("/banners", verifyLogin, async (req, res) => {
  console.log("hellow banner");
  const allBanners = await bannerHelpers.getAllBanners();
  res.render("admin/banners/banners", {
    allBanners,
    successMsg: req.session.adminSuccessMsg,
    adminErr: req.session.adminBannerErr,
  });
  req.session.adminSuccessMsg = false;
  req.session.adminBannerErr = false;
});

//.....Add

router.get("/banners/add", verifyLogin, async (req, res) => {
  console.log("hello banner add");
  res.render("admin/banners/add");
});

router.post("/banners/add", async (req, res) => {
  const banner = await bannerHelpers.addBanner(req.body);
  req.session.adminSuccessMsg = "Successfully Added";
  res.redirect("/admin/banners");
});
//...Delete

router.get("/banners/delete/:id", (req, res) => {
  bannerHelpers.deleteBanner(req.params.id).then(response);
  req.session.adminSuccessMsg = "Successfully Deleted";
  res.redirect("/admin/banners");
});

//...Edit

router.get("/banners/edit/:id", async (req, res) => {
  console.log("hello edit banner");
  let banner = await bannerHelpers.getBannerDetails(req.params.id);
  console.log("edit: banner", banner);
  res.render("admin/banners/edit", {
    banner,
    errorMsg: req.session.adminBannerErr,
  });
  req.session.adminBannerErr = false;
});

router.post("/banners/edit/:id", async (req, res) => {
  await bannerHelpers.updateBanner(req.params.id, req.body).then(response);
  req.session.adminSuccessMsg = "Banner Updated Successfully";
  res.redirect("/admin/banners");
});

module.exports = router;
