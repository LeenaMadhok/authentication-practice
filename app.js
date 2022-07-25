//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt= require("mongoose-encryption");
var md5 = require('md5');

console.log(md5('zxc'));

// to get hold of .env file
// console.log(process.env);

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended:true
}));

mongoose.connect("mongodb://localhost:27017/sampleUserDB",{useNewUrlParser:true});

const userSchema= new mongoose.Schema({
  email:String,
  password: String
});

// for more secure web app move the secret key to the ".env" file.
// var secret = "thisisasmallmessage.";
// userSchema.plugin(encrypt, { secret: process.env.SECRET , encryptedFields:['password']});

const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){
  console.log(req.body);
  const newUser= new User({
    email : req.body.username,
    // password: req.body.password
    password: md5(req.body.password)
  });
  newUser.save(function(err){
    if (!err){
      console.log("added newUser successfully in DB.");
      res.render("secrets");
    }
  });
});

app.post("/login",function(req,res){
  console.log(req.body);
  const username =req.body.username;
  const password= md5(req.body.password);
  User.findOne({email:username},function(err, foundUser){
    if(!err && foundUser){
      console.log(foundUser);
      if(foundUser.password===password){
        console.log("verified user.");
        res.render("secrets");
      }
    }
  });
});


app.listen(3000,function(){
  console.log("server started on port 3000.");
})
