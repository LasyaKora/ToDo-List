var LocalStrategy = require("passport-local").Strategy;

var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var db = require('./db');

const collection ="users";

function initialize(passport) {
 
 passport.serializeUser(function(user, done){
    done(null, user._id);
 });



 passport.deserializeUser(async function(id, done){

  db.getDB().collection(collection).findOne({ _id: db.getPrimaryKey(id) }, (err,result)=>{
    if(err){
      console.log("Error in deserializeUser: " + err);
      return done(err);
    }
    else{
      done(null, result);
    }
  });    
 });

 passport.use(
  'local-signup',
  new LocalStrategy({
   usernameField : 'username',
   passwordField: 'password',
   passReqToCallback: true
 },
 async function(req, username, password, done){


  db.getDB().collection(collection).findOne({ username: username }, (err,result)=>{

   if(err){
    console.log("Error in Signup Register: " + err);
    return done(err);
  }

  if (result) {
    console.log(`Found a listing in the collection with the name '${username}':`);
        //console.log(result);
        return done(null, false, req.flash('signupMessage', 'That is already taken'));

      } else {
        console.log(`No listings found with the name '${username}'`);
        var newUserMysql = {

          username: username,
          password: bcrypt.hashSync(password, null, null)
        }

     //var insertQuery = "INSERT INTO users (username, password) values (?, ?)";
     db.getDB().collection(collection).insertOne(newUserMysql, (err, result)=>{
       if(err){
        console.log("Error in Signup Register Insert : " + err);
        return done(err);
      }
      if (result) {
        console.log(`Added user '${username}':`);
        //console.log(result);
      } else {
        console.log(`Unable to Register User '${username}'`);
      }
      newUserMysql._id = result.insertedId;
      return done(null, newUserMysql);
    });
   }

 } 
 )}

  ));                     



 passport.use(
  'local-login',
  new LocalStrategy({
   usernameField : 'username',
   passwordField: 'password',
   passReqToCallback: true
 },
 function(req, username, password, done){

  db.getDB().collection(collection).findOne({ username: username }, (err,result)=>{

   if(err){
    console.log("Error in Logginh in: " + err);
    return done(err);
  }

  if (!result) {
    console.log('In user not found');
    return done(null, false, req.flash('loginMessage', 'No User Found'));

  } 
  if (!bcrypt.compareSync(password, result.password)){
    return done(null, false, req.flash('loginMessage', 'Wrong Password'));
  }
  else done(null, result);


})
})
  );

}
 module.exports = initialize;