const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConfig = require('../helpers/passport')

// Form validation
const formValidation = require('../helpers/formvalidation')
const signupValidation = formValidation.validateBody(formValidation.schemas.signupSchema)
const signinValidation = formValidation.validateBody(formValidation.schemas.signinSchema)
const emailValidation = formValidation.validateBody(formValidation.schemas.emailSchema)
const passwordValidation = formValidation.validateBody(formValidation.schemas.passwordSchema)

// Passport strategies
const localAuthStrategy = passport.authenticate('local', { session: false })

const UsersController = require('../controllers/users')

router.route('/signup')
    .get(UsersController.getSignUp)

router.route('/signup')
    .post(signupValidation, UsersController.postSignUp)

router.route('/verifyemail/:token')
    .get(UsersController.verifyEmailLink)

router.route('/signin')
    .get(UsersController.getSignIn)

router.route('/signin')
    .post(signinValidation, localAuthStrategy, UsersController.postSignIn)

router.route('/forgotpassword')
    .get(UsersController.forgotPassword)

router.route('/forgotpassword')
    .post(emailValidation, UsersController.submitEmailForPasswordLink)

router.route('/forgotpassword/:token')
    .get(UsersController.forgotPasswordLink)

router.route('/forgotpassword/:token')
    .post(passwordValidation, UsersController.submitNewPassword)

module.exports = router