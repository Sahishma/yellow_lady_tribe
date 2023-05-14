const express = require('express');
const userHelpers = require('../helpers/user-helpers');
const router = express.Router();
const verifyLogin = (req,res,next) => {
  if(req.session.user.loggedIn){
    next();
  }else{
    res.redirect("/login");
  }
};

/* GET home page. */

router.get('/', function(req, res, next) {
  let user = req.session.user;// is user logged in? if yes,session will store the details
  console.log("______________",user);
  // res.render('index', { user, layout: 'user/layout/userLayout', engine: 'userHbs', layoutsDir: __dirname + '/views/user/layout/', partialsDir: __dirname + '/views/user/partials/'});
  res.render('user/index', { user, layout: 'userLayout'});
  // res.render('index', { user});
}); 


/* Register */

router.get('/register',(req,res) =>{
  if (req.session.user) {
    res.redirect('/');
  }
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.render('user/register', {layout: 'userLayout', noNeedNav: true});
});

router.post('/register',(req,res)=>{
  userHelpers.doRegister(req.body).then((response) =>{
    console.log('response from do register helper', response);
    req.session.user=response
    req.session.user.loggedIn=true
    console.log('session after register',req.session);
    res.redirect('/') 
  })
})

/* Login */

router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/');
  }else{
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.render('user/login',{'loginErr':req.session.userLoginErr, layout: 'userLayout', noNeedNav: true});
  req.session.userLoginErr = false
  }
});
router.post('/login',async(req,res)=>{
  const { username, password } = req.body;
  // Check if the user is blocked
  const user = await userHelpers.getUserByUsername(username);

  if (user && user.status === true) {
    // User is blocked, return an appropriate response or error message
    req.session.userLoginErr = 'Your account has been blocked.';
    return res.redirect('/login');
  }
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user = response.user;
      req.session.user.loggedIn = true;
      res.redirect('/')
    }else{
      req.session.userLoginErr = "Invalid User name or Password";
      res.redirect('/login');
    }
  });
});


//logout

router.get("/logout",(req,res)=>{
  req.session.user = null;
  res.redirect("/");
});



module.exports = router;
