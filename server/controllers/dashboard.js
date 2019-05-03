const Op = require('sequelize').Op

const models = require('../models')
const User = models.User
const Member = models.Member
const Group = models.Group
const Problem = models.Problem
const Guide = models.Guide
const Session = models.Session

// Crazy unfriend function. Why tho???
const unfriend = require('../helpers/unfriend')

module.exports = {
    // Dashboard
    getDashboard: async (req, res) => {

        const requestees = await req.user.getRequestees()
        const requesters = await req.user.getRequesters()
        const friends = await req.user.getFriends()
        const guides = await Guide.findAll({
            where: {
                userId: req.user.id
            },
            raw: true
        })
        const groups = await Group.findAll({
            where: {
                leaderId: req.user.id
            },
            raw: true
        })
        const sessions = await Session.findAll({
            where: {
                userId: req.user.id
            },
            raw: true
        })

        let sessionsArr = []

        for (let session of sessions) {
            let sessionObj = {}
            sessionObj.name = session.name
            sessionObj.id = session.id
            sessionObj.userId = req.user.id

            for (let group of groups) {
                if (session.groupId === group.id) {
                    sessionObj.groupName = group.name
                }
            }

            for (let guide of guides) {
                if (session.guideId === guide.id) {
                    sessionObj.guideName = guide.name
                }
            }
            sessionsArr.push(sessionObj)
        }

        let activeFriendSessions = []

        for (let friend of friends) {
            const thisFriendsActiveSessions = await Session.findAll({
                attributes: ['id', 'groupId', 'name'],
                where: {
                    userId: friend.id,
                    active: true
                },
                raw: true
            })
            for (let session of thisFriendsActiveSessions) {
                activeFriendSessions.push({
                    name: session.name,
                    username: friend.username,
                    id: session.id,
                    groupId: session.groupId
                })
            }
        }

        let activeSessions = []

        for (let session of activeFriendSessions) {
            const memberOfGroupForThisSession = await Member.findOne({
                attributes: ['id'],
                where: {
                    userId: req.user.id,
                    groupId: session.groupId
                },
                raw: true
            })
            if (memberOfGroupForThisSession) {
                activeSessions.push(session)
            }
        }

        res.render('dashboard', {
            username: req.user.username,
            requestees,
            requesters,
            friends,
            guides,
            groups,
            sessions: sessionsArr,
            activeSessions,
            loggedIn: true
        })
    },
    // Create, edit, and delete group
    getCreateGroup: async (req, res) => {

        const friends = await req.user.getFriends()

        if (friends.length === 0) {
            return res.redirect('/dashboard')
        }

        res.render('addGroup', { friends, loggedIn: true })
    },
    postCreateGroup: async (req, res) => {

        const groupName = req.body.name

        if (groupName === undefined || groupName === '') {
            return res.redirect('/dashboard/create/group')
        }

        const foundGroup = await Group.findOne({
            where: {
                name: groupName,
                leaderId: req.user.id
            }
        })

        if (foundGroup) {
            return res.render('404')
        }

        let addToGroupIds = req.body.friend
        const groupMembers = []

        console.log(addToGroupIds)

        if (addToGroupIds === undefined) {
            return res.redirect('/dashboard/create/group')
        }

        if (!(addToGroupIds instanceof Array)) {
            addToGroupIds = [req.body.friend]
        }

        const newGroup = await Group.create({
            name: groupName,
            leaderId: req.user.id
        })

        for (const id of addToGroupIds) {
            const foundFriend = await req.user.getFriends({
                where: { id }
            })

            if (foundFriend.length === 0) {
                await newGroup.destroy()
                return res.render('403', { loggedIn: true })
            }

            groupMembers.push({
                userId: id,
                groupId: newGroup.id
            })
        }

        await Member.bulkCreate(groupMembers)

        res.redirect('/dashboard')

    },
    getEditGroup: async (req, res) => {

    },
    postEditGroup: async (req, res) => {

    },
    postDeleteGroup: async (req, res) => {
        const id = req.params.groupId

        const foundGroup = await Group.findOne({
            where: { id, leaderId: req.user.id }
        })

        if (!foundGroup) {
            return res.render('404', { loggedIn: true })
        }

        const foundSessions = await Session.findAll({
            where: {
                userId: req.user.id,
                groupId: foundGroup.id
            }
        })

        if (foundSessions !== undefined && foundSessions.length !== 0) {

            const sessionIds = foundSessions.map(session => session.id)

            await Session.destroy({ where: { id: sessionIds } })
        }

        const groupMembers = await Member.findAll({
            where: {
                groupId: foundGroup.id
            },
            raw: true
        })

        const ids = groupMembers.map(member => member.id)

        await Member.destroy({ where: { id: ids } })
        await foundGroup.destroy()

        res.status(200).json({ 200: 'Group deleted' })

    },
    // Create, edit, and delete study guide
    getCreateGuide: async (req, res) => {

        res.render('addGuide', { loggedIn: true })

    },
    postCreateGuide: async (req, res) => {

        const { name } = req.body
        let questions = req.body.question
        let answers = req.body.answer

        console.log(questions instanceof Array)
        console.log(answers instanceof Array)

        if (!(questions instanceof Array) || !(answers instanceof Array)) {
            questions = [req.body.question]
            answers = [req.body.answer]
        }

        const isUndefined = questions === undefined || answers === undefined
        const isEmpty = questions.length === 0 || answers.length === 0
        const areNotEqualLength = questions.length !== answers.length

        if (!name || isUndefined || isEmpty || areNotEqualLength) {
            return res.render('403', { loggedIn: true })
        }

        const foundGuide = await Guide.findOne({
            where: {
                userId: req.user.id,
                name
            }
        })

        if (foundGuide) {
            return res.render('403', { loggedIn: true })
        }

        const newGuide = await Guide.create({
            name,
            userId: req.user.id
        })

        const problems = []

        questions.forEach((question, index) => {
            problems.push({
                question,
                answer: answers[index],
                guideId: newGuide.id
            })
        })

        await Problem.bulkCreate(problems)

        res.redirect('/dashboard')

    },
    getEditGuide: async (req, res) => {

    },
    postEditGuide: async (req, res) => {

    },
    postDeleteGuide: async (req, res) => {

        const id = req.params.guideId

        const foundGuide = await Guide.findOne({
            where: { id, userId: req.user.id }
        })

        if (!foundGuide) {
            return res.render('404', { loggedIn: true })
        }

        const foundSessions = await Session.findAll({
            where: {
                userId: req.user.id,
                guideId: foundGuide.id
            }
        })

        if (foundSessions !== undefined && foundSessions.length !== 0) {

            const sessionIds = foundSessions.map(session => session.id)

            await Session.destroy({ where: { id: sessionIds } })
        }

        const problems = await Problem.findAll({
            where: {
                guideId: foundGuide.id
            },
            raw: true
        })

        const problemIds = problems.map(problem => problem.id)

        await Problem.destroy({ where: { id: problemIds } })
        await foundGuide.destroy()

        res.status(200).json({ 200: 'Study guide deleted' })

    },
    // Create, edit, and delete study sessions
    getCreateSession: async (req, res) => {

        const groups = await Group.findAll({
            where: {
                leaderId: req.user.id
            },
            raw: true
        })

        if (groups === undefined || groups.length === 0) {
            return res.redirect('/dashboard')
        }

        const guides = await Guide.findAll({
            where: {
                userId: req.user.id
            },
            raw: true
        })

        if (guides === undefined || guides.length === 0) {
            return res.redirect('/dashboard')
        }

        res.render('addSession', { groups, guides, loggedIn: true })

    },
    postCreateSession: async (req, res) => {

        const { name } = req.body
        const groupId = req.body.group
        const guideId = req.body.guide

        console.log(req.body, groupId, guideId)

        if (!name || !groupId || !guideId) {
            res.redirect('/dashboard/create/session')
        }

        const foundGroup = await Group.findOne({
            where: {
                leaderId: req.user.id,
                id: groupId
            }
        })

        if (!foundGroup) {
            return res.render('404', { loggedIn: true })
        }

        const foundGuide = await Guide.findOne({
            where: {
                userId: req.user.id,
                id: guideId
            }
        })

        if (!foundGuide) {
            return res.render('404', { loggedIn: true })
        }

        const foundSession = await Session.findOne({
            where: {
                userId: req.user.id,
                [Op.or]: [
                    { name },
                    { groupId, guideId }
                ]
            }
        })

        if (foundSession) {
            return res.redirect('/dashboard/create/session')
        }

        const newSession = await Session.create({
            userId: req.user.id,
            name,
            groupId,
            guideId
        })

        res.redirect('/dashboard')

    },
    postDeleteSession: async (req, res) => {

        const id = req.params.sessionId

        const foundSession = await Session.findOne({
            where: { id, userId: req.user.id }
        })

        if (!foundSession) {
            return res.render('404', { loggedIn: true })
        }

        await foundSession.destroy()

        res.status(200).json({ 200: 'Session deleted' })

    },
    // Session page
    getSession: async (req, res) => {

        const foundSession = await Session.findOne({
            where: {
                id: req.params.sessionId,
            },
        })

        if (!foundSession) {
            return res.render('404', { loggedIn: true })
        }

        const foundGroup = await Group.findOne({
            where: {
                id: foundSession.groupId,
            },
            raw: true
        })

        if (!foundGroup) {
            return res.render('404', { loggedIn: true })
        }

        const foundMember = await Member.findOne({
            where: {
                userId: req.user.id,
                groupId: foundSession.groupId
            },
            raw: true
        })

        if (!foundMember && req.user.id !== foundGroup.leaderId) {
            return res.render('401')
        }

        if (foundSession.active === false && req.user.id !== foundSession.userId) {
            return res.render('sentEmail', { 
                loggedIn: true,
                message: 'This session is currently inactive'
             })
        }

        const foundGuide = await Guide.findOne({
            where: {
                id: foundSession.guideId,
            },
            raw: true
        })

        if (!foundGuide) {
            return res.render('404', { loggedIn: true })
        }

        const foundProblems = await Problem.findAll({
            where: {
                guideId: foundSession.guideId
            }
        })

        if (foundProblems === undefined || foundProblems.length === 0) {
            return res.render('404', { loggedIn: true })
        }

        socketData = {
            sessionId: foundSession.id,
            guideId: foundGuide.id,        
        }

        if (req.user.id === foundSession.userId) {

            foundSession.active = true
            await foundSession.save()

            socketData.isLeader = true

            return res.render('session', {
                username: req.user.username,
                groupName: foundGroup.name,
                guideName: foundGuide.name,
                sessionName: foundSession.name,
                socketData,
                loggedIn: true
            })
        }

        const foundLeader = await User.findOne({
            where: {
                id: foundSession.userId
            }
        })

        if (!foundLeader) {
            return res.render('404', { loggedIn: true })
        }

        socketData.isLeader = false

        res.render('session', {
            username: req.user.username,
            leader: foundLeader.username,
            groupName: foundGroup.name,
            guideName: foundGuide.name,
            sessionName: foundSession.name,
            socketData,
            loggedIn: true
        })
    },
    // Search and add friends
    getSearch: async (req, res) => {

        res.status(200).json({ 200: 'Search page' })

    },
    postSearch: async (req, res) => {

        const { username } = req.body

        const foundUser = await User.findOne({
            where: { username }
        })

        if (!foundUser || foundUser.id === req.user.id) {
            return res.json({ username: undefined })
        }

        res.json({
            id: foundUser.id,
            username: foundUser.username
        })
    },
    postFriendRequest: async (req, res) => {

        const id = req.params.userId

        if (id == req.user.id) {
            return res.render('403', { loggedIn: true })
        }

        const foundUser = await User.findOne({
            where: { id }
        })


        if (!foundUser) {
            return res.render('404', { loggedIn: true })
        }

        const isFriend = await req.user.hasFriends([foundUser])

        if (isFriend) {
            return res.render('403', { loggedIn: true })
        }

        const isRequestee = await req.user.hasRequestees([foundUser])

        if (isRequestee) {
            return res.status(200).json({ 200: 'You have already friend requested this user' })
        }

        const isRequester = await req.user.hasRequesters([foundUser])

        if (isRequester) {
            return res.status(200).json({ 200: 'User has already friend requested you, accept their friend request to become friends' })
        }

        await req.user.addRequestees(foundUser)

        res.redirect('/dashboard')

    },
    postCancelFriendRequest: async (req, res) => {

        const id = req.params.userId

        if (id == req.user.id) {
            return res.render('403', { loggedIn: true })
        }

        const foundUser = await User.findOne({
            where: { id }
        })

        if (!foundUser) {
            return res.render('404', { loggedIn: true })
        }

        const requestee = await req.user.getRequestees({
            where: { id: foundUser.id }
        })

        if (requestee.length === 0) {
            return res.render('404', { loggedIn: true })
        }

        await req.user.removeRequestee(requestee)

        const requestees = await req.user.getRequestees()

        res.status(200).json({ 200: requestees })
    },
    postAcceptFriendRequest: async (req, res) => {

        const id = req.params.userId

        if (id == req.user.id) {
            return res.render('403', { loggedIn: true })
        }

        const foundUser = await User.findOne({
            where: { id }
        })

        if (!foundUser) {
            return res.render('404', { loggedIn: true })
        }

        const requester = await req.user.getRequesters({
            where: { id: foundUser.id }
        })

        if (requester.length === 0) {
            return res.render('404', { loggedIn: true })
        }

        await req.user.addFriends(requester)
        await requester[0].addFriends(req.user)
        await req.user.removeRequester(requester)

        const friends = await req.user.getFriends()

        res.status(200).json({ 200: friends })

    },
    postDenyFriendRequest: async (req, res) => {

        const id = req.params.userId

        if (id == req.user.id) {
            return res.render('403', { loggedIn: true })
        }

        const foundUser = await User.findOne({
            where: { id }
        })

        if (!foundUser) {
            return res.render('404', { loggedIn: true })
        }

        const requester = await req.user.getRequesters({
            where: { id: foundUser.id }
        })

        if (requester.length === 0) {
            return res.render('404', { loggedIn: true })
        }

        await req.user.removeRequester(requester)

        const requesters = await req.user.getRequesters()

        res.status(200).json({ 200: requesters })
    },
    postUnfriend: async (req, res) => {

        const id = req.params.userId

        if (id == req.user.id) {
            return res.render('403', { loggedIn: true })
        }

        const foundUser = await User.findOne({
            where: { id }
        })

        if (!foundUser) {
            return res.render('404', { loggedIn: true })
        }

        const friend = await req.user.getFriends({
            where: { id: foundUser.id }
        })

        if (friend.length === 0) {
            return res.render('404', { loggedIn: true })
        }

        const foundFriendMembers = await Member.findAll({
            attributes: ['id', 'userId', 'groupId'],
            where: {
                userId: friend[0].id
            }
        })

        if (foundFriendMembers.length === 0) {
            await req.user.removeFriend(friend)
            await friend[0].removeFriend(req.user)

            // Check their end:
            await unfriend(friend[0], req.user)

            return res.status(200).json({200: 'Success'})
        }

        const foundGroups = await Group.findAll({
            attributes: ['id', 'leaderId'],
            where: {
                leaderId: req.user.id
            }
        })

        if (foundGroups.length === 0) {
            await req.user.removeFriend(friend)
            await friend[0].removeFriend(req.user)

            // Check their end
            await unfriend(friend[0], req.user)

            return res.status(200).json({200: 'Success'})
        }

        let membersToDelete = []
        let groupsThisFriendIsAMemberOf = []

        for (let friendMember of foundFriendMembers) {
            for (let group of foundGroups) {
                if (friendMember.groupId === group.id) {
                    groupsThisFriendIsAMemberOf.push(group)
                    membersToDelete.push(friendMember)
                }
            }
        }

        if (groupsThisFriendIsAMemberOf.length === 0) {
            await req.user.removeFriend(friend)
            await friend[0].removeFriend(req.user)

            // Check their end
            await unfriend(friend[0], req.user)

            return res.status(200).json({200: 'Success'})
        }

        const membersToDeleteIds = membersToDelete.map(member => member.id)

        await Member.destroy({ where: { id: membersToDeleteIds }})

        let groupsToDelete = []

        for (let group of groupsThisFriendIsAMemberOf) {
            const foundMember = await Member.findOne({
                where: {
                    groupId: group.id
                }
            })
            if (!foundMember) {
                groupsToDelete.push(group)
            }
        }

        if (groupsToDelete.length === 0) {

            await req.user.removeFriend(friend)
            await friend[0].removeFriend(req.user)
            
            // Check their end
            await unfriend(friend[0], req.user)

            return res.status(200).json({200: 'Success'})
        }

        const groupsToDeleteIds = groupsToDelete.map(group => group.id)

        const foundSessions = await Session.findAll({
            attributes: ['id', 'userId', 'groupId'],
            where: {
                userId: req.user.id
            }
        })

        if (foundSessions.length === 0) {

            await Group.destroy({ where: { id: groupsToDeleteIds }})
            await req.user.removeFriend(friend)
            await friend[0].removeFriend(req.user)

            // Check their end
            await unfriend(friend[0], req.user)

            return res.status(200).json({200: 'Success'})
        }

        let sessionsToDelete = []

        for (let session of foundSessions) {
            for (let group of groupsToDelete) {
                if (session.groupId === group.id) {
                    sessionsToDelete.push(session)
                }
            }
        }

        if (sessionsToDelete.length === 0) {

            await Group.destroy({ where: { id: groupsToDeleteIds }})
            await req.user.removeFriend(friend)
            await friend[0].removeFriend(req.user)

            // Check their end
            await unfriend(friend[0], req.user)

            return res.status(200).json({200: 'Success'})

        }

        const sessionsToDeleteIds = sessionsToDelete.map(session => session.id)

        await Session.destroy({ where: { id: sessionsToDeleteIds }})
        await Group.destroy({ where: { id: groupsToDeleteIds }})
        await req.user.removeFriend(friend)
        await friend[0].removeFriend(req.user)

        // Check their end
        await unfriend(friend[0], req.user)

        const friends = await req.user.getFriends()

        res.status(200).json({ 200: friends })
    }
}