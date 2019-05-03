const Op = require('sequelize').Op
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const JwtStrategy = require('passport-jwt').Strategy
const { ExtractJwt } = require('passport-jwt')

const User = require('../models').User;
const { JWT_SECRET } = require('../config/keys')

passport.use(new JwtStrategy({
    jwtFromRequest: (req) => {
        var token = null
        if (req && req.cookies) {
            token = req.cookies['jwt']
        }
        return token
    },
    secretOrKey: JWT_SECRET
}, async (payload, done) => {

    try {

        const user = await User.findOne({
            where: {
                id: payload.sub
            }
        })

        if (!user) {
            return done(null, false)
        }

        done(null, user)
    } catch (error) {
        done(error, false)
    }

}))

passport.use(new LocalStrategy({
    usernameField: 'usernameOrEmail'
}, async (usernameOrEmail, password, done) => {

    try {
        const foundUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username: usernameOrEmail }, 
                    { email: usernameOrEmail }
                ]
            } 
        })

        if (!foundUser) {
            return done(null, false)
        }

        const isMatch = await foundUser.isValidPassword(password)

        if (!isMatch) {
            return done(null, false)
        }

        done(null, foundUser)
    } catch (error) {
        done(error, false)
    }
     
}))