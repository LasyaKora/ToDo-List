var express = require('express');
var session = require('cookie-session'); // Loads the piece of middleware for sessions
var bodyParser = require('body-parser'); // Loads the piece of middleware for managing the settings
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var app = express();


/* Using the sessions */
app.use(session({secret: 'todotopsecret'}))

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

/* The to do list and the form are displayed */
app.get('/todo', function(req, res) { 
    res.render('todo.ejs', {todolist: req.session.todolist, datelist: req.session.datelist, search_value: ''});
})

/* Adding an item to the to do list */
app.post('/todo/add/', urlencodedParser, function(req, res) {
	let date= new Date();
    let myDate= date.getFullYear()+'-'+('0'+ (date.getMonth() + 1)).slice(-2)+'-'+('0'+ date.getDate()).slice(-2);
    if(req.body.newdate != ''){
    	myDate=req.body.newdate;
    }
    if (req.body.newtodo != '') {
    	req.session.todolist.push(req.body.newtodo);
        req.session.datelist.push(myDate);
    }
    res.redirect('/todo');
})

app.post('/todo/search/',urlencodedParser,function(req,res){
	req.session.tlist=[];
	req.session.dlist=[];
	for(let i=0;i<req.session.todolist.length;i++){
		if(req.session.todolist[i].toUpperCase().indexOf(req.body.search_box.toUpperCase())!=-1){
			req.session.tlist.push(req.session.todolist[i]);
			req.session.dlist.push(req.session.datelist[i]);
		}
	}
	res.render('todo.ejs', {todolist: req.session.tlist, datelist: req.session.dlist, search_value: req.body.search_box});
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
    res.redirect('/todo');
})

app.listen(8080);   