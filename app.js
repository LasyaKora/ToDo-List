var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // Loads the piece of middleware for managing the settings
var flash=require('express-flash');
var session= require('express-session')
var bcrypt= require('bcryptjs');
var  passport = require('passport');
var initializePassport = require('./passport-config')
var methodOverride = require('method-override')

var db = require('./db');

const collection ="todolist";


db.connect((err)=>{
	if(err){
		console.log("Unable to connect to Database");
		process.exit(1);
	}
	else{
		app.listen(8080,()=>{
			console.log("Connected to Database");
			
		}); 
		
	}
	
})


app.use(bodyParser.urlencoded({ extended: false }));
app.use(flash());
/* Using the sessions */
app.use(session({
	secret: 'lasyasecret',
	resave: true,
	saveUninitialized: true,
	cookie : {
		maxAge: 1000* 60 * 60 *24 * 365
	},
	rolling: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'));

/* If there is no to do list in the session, 
we create an empty one in the form of an array before continuing */

function checkAuthenticated(req,res,next){
	//console.log('Check authenticated')
	if(req.isAuthenticated()){
		return next()
	}
	res.redirect('/login');
}

function checkNotAuthenticated(req,res,next){
	//console.log('Check not authenticated')
	if(req.isAuthenticated()){
		return res.redirect('/todo')
	}
	next();
}

/*function getToDoList(userId,callback) {

	db.getDB().collection(collection).find({ user_id: userId }, async (err,result)=>{
		if (err)  return callback(err);
		else {
			const res = await result.sort({task_compl: 1, todoDate: 1}).toArray();
			console.log("Displaying ToDo List : " + res.length  + " -- " + res); 
			callback(null, res);
			}
	});	
}
*/
function getToDoList(userId,callback) {

	db.getDB().collection(collection).find({ user_id: 
		userId }).sort({task_compl: 1, todoDate: 1}).toArray(  (err,result)=>{
		if (err)  return callback(err);
		else {
			//const res = await result.sort({task_compl: 1, todoDate: 1}).toArray();
			//console.log("Displaying ToDo List : " + res.length  + " -- " + res); 
			callback(null, result);
			}
	});	
}

function getToDoListSearch(userId, searchVar, callback) {
	//var result =[];
	
	//searchVar = "/.*"+searchVar.toUpperCase() +".*/i";
	//let sql_query= "select * from todolist where user_id = ? and UPPER(todoText) like ? order by task_compl,todoDate" ;
	db.getDB().collection(collection).find({ user_id: userId, 
		todoText: new RegExp(searchVar, "i") }).sort({task_compl: 1,
		 todoDate: 1}).toArray(  (err,result)=>{
		if (err)  return callback(err);
		else {
			//const res = await result.sort({task_compl: 1, todoDate: 1}).toArray();
			//console.log("Displaying Search  List : " + res.length  + searchVar + res); 
			callback(null, result);
			}
	});	
}



initializePassport(passport);

app.get('/login',checkNotAuthenticated, function(req,res){
	res.render('login.ejs', {message:req.flash('loginMessage')})
})

app.get('/register',checkNotAuthenticated,function(req,res){
	res.render('register.ejs',{message: req.flash('signupMessage')})
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local-login',{
	successRedirect: '/todo',
	failureRedirect: '/login',
	failureFlash: true
}))

/* Registration Code

*/
app.post('/register',checkNotAuthenticated, passport.authenticate('local-signup',{
	successRedirect: '/login',
	failureRedirect: '/register',
	failureFlash: true
}))

app.delete('/logout', (req,res)=> {
	req.logOut()
	res.redirect('/login')
})



/* The to do list and the form are displayed */
app.get('/todo',checkAuthenticated, function(req, resp) { 
	//var result
	getToDoList(req.user._id,function(err,res){
		if(!err){
			resp.render('todo.ejs', {todolist: res, search_value: '', username: req.user.username});
		}
		//result=res;
		//console.log(res)
	})
    //console.log(result)
})

app.post('/todo/checkbox/',function(req,res){
	var c = false;
	if(req.body.cbx){
		c=true;
	}
	 var myquery = { _id: db.getPrimaryKey(req.body.todo_id) };
  	var newvalues = { $set: {task_compl: c, upd_date: new Date() } };
  	db.getDB().collection(collection).updateOne(myquery, newvalues,  (err,result)=>{
		if (err)  {
				console.log("In Cehck update " + err.message);
				throw err;
		}
		else {
			//const res = await result.toArray();
			//console.log("Displaying Checkbox updated : " + req.body.todo_id);
			//callback(null, res);
			}
			res.redirect('/todo');
	});	
	//console.log("Displaying Check update : " + req.body.todo_id);
})

/* Adding an item to the to do list */
app.post('/todo/add/', function(req, res) {
	var myDate = new Date();
	
	if(req.body.newdate != ''){
		myDate=req.body.newdate;
	}

	db.getDB().collection(collection).insertOne({ user_id: req.user._id, todoText: req.body.newtodo, 
			todoDate: new Date(myDate), task_compl: false, upd_date: new Date() }, (err,result)=>{
		if(err){
				console.log("In insert Todo list " + err.message);
				throw err;
		}
		res.redirect('/todo');
	});	

	/*var insertQuery = "INSERT INTO todolist (user_id, todoText, todoDate) values (?,?, ?)";

	connection.query(insertQuery, [req.user.id,req.body.newtodo, myDate],
		function(err, rows){
			if(err){
				throw err;
			}
		});*/

})

/* Searching an iten from the to do list*/
app.post('/todo/search/',checkAuthenticated,function(req,resp){
	getToDoListSearch(req.user._id, req.body.search_box, function(err,res){
		if(!err){
			resp.render('todo.ejs', {todolist: res, search_value: req.body.search_box, username: req.user.username});
		}
		else
		{
			console.log("In Search Todo list " + err.message);
		}
	})
	//res.render('todo.ejs', {todolist: tlist, search_value: req.body.search_box, username: req.user.username});
})

/* Deletes an item from the to do list */
app.get('/todo/delete/:id', function(req, res) {
	if (req.params.id != '') {
		var res;
        var myquery = { _id: db.getPrimaryKey(req.params.id) };
        db.getDB().collection(collection).deleteOne(myquery, (err,result)=>{
		if(err){
				console.log("In Delete Todo list " + err.message);
				throw err;
		}
		res.redirect('/todo');
	});	
    }
})

/* Redirects to the to do list if the page requested is not found */
app.use(function(req, res,next){
	//console.log('Use 2');
	res.redirect('/login');
})

