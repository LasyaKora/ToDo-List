var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // Loads the piece of middleware for managing the settings
var flash=require('express-flash');
var session= require('express-session')
var bcrypt= require('bcryptjs');
var  passport = require('passport');
var initializePassport = require('./passport-config')
var methodOverride = require('method-override')
var mysql=require('mysql')
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);


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

function getToDoList(userId,callback) {
		var result =[];
		let sql_query= "select * from todolist where user_id = ? order by task_compl,todoDate";
		connection.query(sql_query,userId, function(err, res){
		    if (err)  return callback(err);
		    if(res.length){
			    for(var i = 0; i<res.length; i++ ){     
                    result.push(res[i]);
        		}
			}
			//console.log(result);
			callback(null, result);
		})
}

function getToDoListSearch(userId, searchVar, callback) {
		var result =[];
		searchVar = '%' + searchVar.toUpperCase() + '%';
		let sql_query= "select * from todolist where user_id = ? and UPPER(todoText) like ? order by task_compl,todoDate" ;
		connection.query(sql_query, [userId, searchVar], function(err, res){
		    if (err)  {
		    	console.log("In getToDoListSearch Error " + err); 
		    	return callback(err);
		    }
		    if(res.length){
			    for(var i = 0; i<res.length; i++ ){    
			    	//console.log("In getToDoListSearch for loop " + i + " -- " + res[i].user_id); 
                    result.push(res[i]);
        		}
			}
			callback(null, result);
		})
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
	getToDoList(req.user.id,function(err,res){
		if(!err){
			resp.render('todo.ejs', {todolist: res, search_value: '', username: req.user.username});
		}
		//result=res;
		//console.log(res)
	})
    //console.log(result)
})

app.post('/todo/checkbox/',function(req,res){
	var c = 0;
	if(req.body.cbx){
		c=1
	}
	var updateQuery = "UPDATE todolist SET task_compl= ? WHERE todo_id = ?"
	connection.query(updateQuery, [c,req.body.todo_id],
      function(err, rows){
      		if(err){
      			console.log(err.message);
      			throw err;
      		}
      		console.log(rows);
     });
	console.log("In post Checkbox sql " + updateQuery );
	res.redirect('/todo');
})

/* Adding an item to the to do list */
app.post('/todo/add/', function(req, res) {
	var myDate = new Date();
	
    if(req.body.newdate != ''){
    	myDate=req.body.newdate;
    }
    var insertQuery = "INSERT INTO todolist (user_id, todoText, todoDate) values (?,?, ?)";

    connection.query(insertQuery, [req.user.id,req.body.newtodo, myDate],
      function(err, rows){
      		if(err){
      			throw err;
      		}
     });
    
    res.redirect('/todo');
})

/* Searching an iten from the to do list*/
app.post('/todo/search/',checkAuthenticated,function(req,resp){
	getToDoListSearch(req.user.id, req.body.search_box, function(err,res){
		if(!err){
			resp.render('todo.ejs', {todolist: res, search_value: req.body.search_box, username: req.user.username});
		}
	})
	//res.render('todo.ejs', {todolist: tlist, search_value: req.body.search_box, username: req.user.username});
})

/* Deletes an item from the to do list */
app.get('/todo/delete/:id', function(req, res) {
    if (req.params.id != '') {
        //req.session.todo.splice(req.params.id, 1);
        var delQuery = "delete  from todolist where todo_id = ? ";

	    connection.query(delQuery, [req.params.id],
	      function(err, rows){
	      		if(err){
	      			throw err;
      		}
     });

    }
    res.redirect('/todo');
})

/* Redirects to the to do list if the page requested is not found */
app.use(function(req, res,next){
	//console.log('Use 2');
    res.redirect('/login');
})

app.listen(8080);   