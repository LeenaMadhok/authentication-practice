//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//Oauth 2.0
const GoogleStrategy = require('passport-google-oauth20').Strategy;
//for makinf the findorcreate function work
const findOrCreate = require('mongoose-findorcreate');

// const encrypt= require("mongoose-encryption");
// const md5 = require('md5');
// const bcrypt = require("bcrypt");

// const saltRounds = 10;

// console.log(md5('zxc'));

// to get hold of .env file
// console.log(process.env);

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret:process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/sampleUserDB", {
  useNewUrlParser: true
});
// mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// for more secure web app move the secret key to the ".env" file.
// var secret = "thisisasmallmessage.";
// userSchema.plugin(encrypt, { secret: process.env.SECRET , encryptedFields:['password']});

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

//this line of code will take the user to select google account page when clicked on login with google button
app.get("/auth/google",passport.authenticate("google", { scope: ["profile","email"] }));

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets page.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets",function(req,res){
  // if(req.isAuthenticated()){
  //   res.render("secrets");
  // }else{
  //   res.redirect("login");
  // }
  User.find({"secret":{$ne: null}},function(err,foundUsers){
    console.log(foundUsers);
    if(!err && foundUsers){
      res.render("secrets",{userWithSecrets:foundUsers});
    }
  });
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("login");
  }
});

app.post("/submit",function(req,res){
  const submittedSecret=req.body.secret;
  console.log(req.user.id);
  User.findById(req.user.id,function(err,foundUser){
    if(!err && foundUser){
      foundUser.secret=submittedSecret;
      foundUser.save(function(){
        console.log("add to db the secret of a respective user.");
        res.redirect("/secrets")
      });
    }
  });
});

app.get("/logout",function(req,res){
  req.logout(function(err){
    if(!err){
      res.redirect("/");
    }
  });
});

app.post("/register", function(req, res) {
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("register");
    }else{
      passport.authenticate("local")(req,res,function(){
        //checked when authentication is successfull.
        res.redirect("secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {
  const user =new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        //checked when authentication is successfull.
        res.redirect("secrets");
      });
    }
  });
});



//  THIS IS USED WITH PACKAGES LIKE md5 , express-encryption , bcrypt
// app.post("/register", function(req, res) {
//   console.log(req.body);
//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     const newUser = new User({
//       email: req.body.username,
//       // password: req.body.password
//       password: hash
//     });
//     newUser.save(function(err) {
//       if (!err) {
//         console.log("added newUser successfully in DB.");
//         res.render("secrets");
//       }
//     });
//   });
//
// });
//
// app.post("/login", function(req, res) {
//   console.log(req.body);
//   const username = req.body.username;
//   const password= req.body.password;
//   User.findOne({email: username}, function(err, foundUser) {
//     if (!err && foundUser) {
//       console.log(foundUser);
//       // if (foundUser.password === password) {
//       //   console.log("verified user.");
//       bcrypt.compare(password, foundUser.password, function(err, result) {
//         if (result === true){
//           res.render("secrets");
//         }
//       });
//     }
//   });
// });


app.listen(3000, function() {
  console.log("server started on port 3000.");
})
