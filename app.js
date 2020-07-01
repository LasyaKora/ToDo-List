var express = require('express');
var session = require('cookie-session'); // Loads the piece of middleware for sessions
var bodyParser = require('body-parser'); // Loads the piece of middleware for managing the settings
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var app = express();


/* Using the sessions */
app.use(session({secret: 'todotopsecret'}))


/* If there is no to do list in the session, 
we create an empty one in the form of an array before continuing */
app.use(function(req, res,next){
    if (typeof(req.session.lasyalist) == 'undefined') {
        req.session.lasyalist = [];
    }
    next();
})

/* The to do list and the form are displayed */
app.get('/todo', function(req, res) { 
    res.render('todo.ejs', {todolist: req.session.lasyalist});
})

/* Adding an item to the to do list */
app.post('/todo/add/', urlencodedParser, function(req, res) {
    if (req.body.newtodo != '') {
        req.session.lasyalist.push(req.body.newtodo);
    }
    res.redirect('/todo');
})

/* Deletes an item from the to do list */
app.get('/todo/delete/:id', function(req, res) {
    if (req.params.id != '') {
        req.session.lasyalist.splice(req.params.id, 1);
    }
    res.redirect('/todo');
})

/* Redirects to the to do list if the page requested is not found */
app.use(function(req, res,next){
    res.redirect('/todo');
})

app.listen(8080);   