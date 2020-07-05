const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs');

function initialize(passport, getUser, getUserById){
	const authenticateUser = async function (username,password,done){
			var user = getUser(username)
			if(user == null){
				return done(null,false,{message: 'No user with that username'})
			}
			try{
				if(await bcrypt.compare(password,user.password)){
					return done(null,user)
				}else{
					return done(null, false, { message: 'Password Incorrect'})
				}
			}catch(e){
				return done(e);
			}
	}
	passport.use(new LocalStrategy({ usernameField: 'username' },authenticateUser));
	passport.serializeUser((user,done) => done(null,user.id));
	passport.deserializeUser((id,done)=> {
		 return done(null,getUserById(id))
	});
}

module.exports= initialize