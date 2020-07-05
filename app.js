var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // Loads the piece of middleware for managing the settings
var flash=require('express-flash');
var session= require('express-session')
var bcrypt= require('bcryptjs');
var  passport = require('passport');
var initializePassport = require('./passport-config')
var methodOverride = require('method-override')


const users = [];
app.use(bodyParser.urlencoded({ extended: false }));

var d = new Date();
var curr_date=d.getFullYear()+'-'+('0'+ (d.getMonth() + 1)).slice(-2)+'-'+('0'+ d.getDate()).slice(-2);
app.use(flash());

/* Using the sessions */
app.use(session({
	secret: 'lasyasecret',
	resave: false,
	saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.use(express.static(__dirname + '/public'));

/* If there is no to do list in the session, 
we create an empty one in the form of an array before continuing */
app.use(function(req, res,next){
    if (typeof(req.session.todolist) == 'undefined') {
        req.session.todolist = [];
        req.session.datelist = [];
    }
    next();
})

initializePassport(
	passport,
	username => users.find(user => user.username === username),
	id => users.find(user => user.id === id)
)

app.get('/login',checkNotAuthenticated, function(req,res){
	res.render('login.ejs')
})

app.get('/register',checkNotAuthenticated,function(req,res){
	res.render('register.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local',{
	successRedirect: '/todo',
	failureRedirect: '/login',
	failureFlash: true
}))

/* Registration Code

*/
app.post('/register',checkNotAuthenticated, async function(req,res){
	try{
		const hashedPassword = await bcrypt.hash(req.body.password,10)
		users.push({
			id: Date.now().toString(),
			username: req.body.username,
			password: hashedPassword
		})
		res.redirect('/login')
	}
	catch(err){
		res.redirect('/register')
	}
})

app.delete('/logout', (req,res)=> {
	req.logOut()
	res.redirect('/login')
})

function checkAuthenticated(req,res,next){
	if(req.isAuthenticated()){
		return next()
	}
	res.redirect('/login')
}

function checkNotAuthenticated(req,res,next){
	if(req.isAuthenticated()){
		return res.redirect('/todo')
	}
	next()
}

/* The to do list and the form are displayed */
app.get('/todo',checkAuthenticated, function(req, res) { 
    res.render('todo.ejs', {todolist: req.session.todolist, datelist: req.session.datelist, search_value: ''});
})

/* Adding an item to the to do list */
app.post('/todo/add/', function(req, res) {
	let date= new Date();
    let myDate= curr_date;
    if(req.body.newdate != ''){
    	myDate=req.body.newdate;
    }
    if (req.body.newtodo != '') {
    	req.session.todolist.push(req.body.newtodo);
        req.session.datelist.push(myDate);
    }
    res.redirect('/todo');
})

app.post('/todo/search/',function(req,res){
	let tlist=[];
	let dlist=[];
	for(let i=0;i<req.session.todolist.length;i++){
		if(req.session.todolist[i].toUpperCase().indexOf(req.body.search_box.toUpperCase())!=-1){
			req.session.tlist.push(req.session.todolist[i]);
			req.session.dlist.push(req.session.datelist[i]);
		}
	}
	res.render('todo.ejs', {todolist: tlist, datelist: dlist, search_value: req.body.search_box});
})

/* Deletes an item from the to do list */
app.get('/todo/delete/:id', function(req, res) {
    if (req.params.id != '') {
        req.session.todolist.splice(req.params.id, 1);
        req.session.datelist.splice(req.params.id, 1);
    }
    res.redirect('/todo');
})

/* Redirects to the to do list if the page requested is not found */
app.use(function(req, res,next){
    res.redirect('/login');
})

app.listen(8080);   