const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConfig = require('../helpers/passport')

// Form validation
const formValidation = require('../helpers/formvalidation')
const usernameValidation = formValidation.validateBody(formValidation.schemas.usernameSchema)
const groupValidation = formValidation.validateBody(formValidation.schemas.groupSchema)
// const nameValidation = formValidation.validateBody(formValidation.schemas.nameSchema)

// Passport strategies
const jwtAuthStrategy = passport.authenticate('jwt', { session: false })


const DashboardController = require('../controllers/dashboard')

// Dashboard home page
router.route('/')
    .get(jwtAuthStrategy, DashboardController.getDashboard)

// Create, edit, and delete group
router.route('/create/group')
    .get(jwtAuthStrategy, DashboardController.getCreateGroup)

router.route('/create/group')
    .post(jwtAuthStrategy, DashboardController.postCreateGroup)

router.route('/delete/group/:groupId') // localhost/delete/group/56y5hergrgr
    .post(jwtAuthStrategy, DashboardController.postDeleteGroup)

// Create, edit, and delete study guide
router.route('/create/guide')
    .get(jwtAuthStrategy, DashboardController.getCreateGuide)

router.route('/create/guide')
    .post(jwtAuthStrategy, DashboardController.postCreateGuide)

router.route('/delete/guide/:guideId')
    .post(jwtAuthStrategy, DashboardController.postDeleteGuide)

// Create, edit, and delete session
router.route('/create/session')
    .get(jwtAuthStrategy, DashboardController.getCreateSession)

router.route('/create/session')
    .post(jwtAuthStrategy, DashboardController.postCreateSession)

router.route('/delete/session/:sessionId')
    .post(jwtAuthStrategy, DashboardController.postDeleteSession)

router.route('/session/:username/:sessionId')
    .get(jwtAuthStrategy, DashboardController.getSession)


// Search and add friends
router.route('/search')
    .get(jwtAuthStrategy, DashboardController.getSearch)

router.route('/search')
    .post(jwtAuthStrategy, DashboardController.postSearch)

router.route('/request/:userId')
    .post(jwtAuthStrategy, DashboardController.postFriendRequest)

router.route('/cancel/:userId')
    .post(jwtAuthStrategy, DashboardController.postCancelFriendRequest)

router.route('/accept/:userId')
    .post(jwtAuthStrategy, DashboardController.postAcceptFriendRequest)

router.route('/deny/:userId')
    .post(jwtAuthStrategy, DashboardController.postDenyFriendRequest)

router.route('/unfriend/:userId')
    .post(jwtAuthStrategy, DashboardController.postUnfriend)

module.exports = router