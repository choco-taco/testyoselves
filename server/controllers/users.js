const Op = require('sequelize').Op
const bcrypt = require('bcryptjs')
// Helpers
const genToken = require('../helpers/gentoken')
const signToken = require('../helpers/signtoken')
const emailUser = require('../helpers/nodemailer')
// Models
const models = require('../models')
const User = models.User
const Token = models.Token

module.exports = {
    // Signup controller
    getSignUp: async (req, res) => {
        if (req.cookies['jwt']) {
            return res.redirect('/dashboard')
        }
        res.render('signup')
    },
    postSignUp: async (req, res) => {
        const { username, email, password } = req.value.body
        let errors = []

        const foundUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username.toLowerCase() }, 
                    { email: email.toLowerCase() }
                ]
            }
        })

        if (foundUser) {
            if (username.toLowerCase() === foundUser.username) {
                errors.push({ message: 'Username is in use' })
            }
            if (email.toLowerCase() === foundUser.email) {
                errors.push({ message: 'Email is in use' })
            }
            return res.render('signup', { errors })
        }

        const newUser = await User.create({ username, email, password })
        const newToken = await Token.create({ 
            type: 'verify',
            token: await genToken(),
            userId: newUser.id
        })

        await emailUser(newUser.email, newToken.type, newToken.token)

        res.render('sentEmail', {
            message: 'Verification email link has been sent!'
        })
    },
    // Email verification controller
    verifyEmailLink: async (req, res) => {
        const foundToken = await Token.findOne({ 
            where: {
                [Op.and]: [
                    { type: 'verify' },
                    { token: req.params.token }
                ]
            }
         })

        if (!foundToken) {
            return res.render('404')
        }

        const foundUser = await User.findOne({ 
            where: {
                id: foundToken.userId
            }
         })

        if (!foundUser) {
            return res.render('404')
        }

        foundUser.active = true
        await foundUser.save()
        await foundToken.destroy()

        res.redirect('/users/signin')

    },
    // Signin controller
    getSignIn: async (req, res) => {
        if (req.cookies['jwt']) {
            return res.redirect('/dashboard', { loggedIn: true })
        }
        res.render('signin')
    },
    postSignIn: async (req, res) => {

        let errors = []

        if (!req.user.active) {

            const foundToken = await Token.findOne({ 
                where: {
                    userId: req.user.id
                }
             });
            
            if (foundToken) {
                errors.push({ message: 'Email has not yet been verified' })
                return res.render('signin', { errors })
            }

            const newToken = await Token.create({
                type: 'verify',
                token: await genToken(),
                userId: req.user.id
            })

            await emailUser(req.user.email, newToken.type, newToken.token)

            return res.render('sentEmail', {
                message: 'Verification email link has been resent!'
            })
        }
        
        const jwtToken = signToken(req.user)
        res.cookie('jwt', jwtToken)

        res.redirect('/dashboard')

    },
    // Reset password
    forgotPassword: async (req, res) => {

        if (req.cookies['jwt']) {
            return res.redirect('/dashboard')
        }

        res.render('forgotPassword')
    },
    // Submit email to receive forgot password link
    submitEmailForPasswordLink: async (req, res) => {

        const { email } = req.value.body

        const foundUser = await User.findOne({
            where: { email: email.toLowerCase() }
        })

        if (!foundUser) {
            console.log('Email was not found')
            return res.redirect('forgotPassword')
        }

        const newToken = await Token.create({
            type: 'reset',
            token: await genToken(),
            userId: foundUser.id
        })

        await emailUser(foundUser.email, newToken.type, newToken.token)

        console.log('Reset password link sent')
        res.redirect('/users/signin')
    },
    // Reset password link
    forgotPasswordLink: async (req, res) => {

        const foundToken = await Token.findOne({
            where: {
                [Op.and]: [
                    { type: 'reset' },
                    { token: req.params.token }
                ]
            }
        })

        if (!foundToken) {
            return res.status(404)
        }

        res.render('resetPassword')
    },
    // Submit new password
    submitNewPassword: async (req, res) => {

        const newPassword = req.value.body.password

        const foundToken = await Token.findOne({
            where: {
                [Op.and]: [
                    { type: 'reset' },
                    { token: req.params.token }
                ]
            }
        })

        if (!foundToken) {
            return res.status(404)
        }

        const foundUser = await User.findOne({ 
            where: {
                id: foundToken.userId
            }
         })

        if (!foundUser) {
            return res.status(404)
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt)

        foundUser.password = hash
        await foundUser.save()
        await foundToken.destroy()

        res.redirect('/users/signin', { success: 'Password has been reset' })

    }
}