const localStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt');

function initialize(passport, getUser, getUserById){
	const authenticateUser = async fucntion (username,password,done){
			const user = getUser(username)
			if(user == null){
				return done(null,false,{message: 'No user with that username'})
			}
			try{
				if(await bcrypt.compare(password,user.password)){
					return done(null,true)
				}else{
					return done(null, flase, { message: 'Password Incorrect'})
				}
			}catch(e){
				return done(e);
			}
	}
	passport.use(new LocalStrategy({ usernameField: 'username' },authenticateUser))
	passport.serializeUser((user,done) => done(null,user.id))
	passport.deserializeUser((user,done)=> {
		return done(null,getUserById(id))
	})
}

module.exports= initialize