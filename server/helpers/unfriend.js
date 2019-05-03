const models = require('../models')
const Member = models.Member
const Group = models.Group
const Session = models.Session

module.exports = async (thisUser, friend) => {

    const foundFriendMembers = await Member.findAll({
        attributes: ['id', 'userId', 'groupId'],
        where: {
            userId: friend.id
        }
    })

    if (foundFriendMembers.length === 0) {
        return
    }

    const foundGroups = await Group.findAll({
        attributes: ['id', 'leaderId'],
        where: {
            leaderId: thisUser.id
        }
    })

    if (foundGroups.length === 0) {
        return
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
        return
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
        return
    }

    const groupsToDeleteIds = groupsToDelete.map(group => group.id)

    const foundSessions = await Session.findAll({
        attributes: ['id', 'userId', 'groupId'],
        where: {
            userId: thisUser.id
        }
    })

    if (foundSessions.length === 0) {
        await Group.destroy({ where: { id: groupsToDeleteIds }})
        return
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
        return
    }

    const sessionsToDeleteIds = sessionsToDelete.map(session => session.id)

    await Session.destroy({ where: { id: sessionsToDeleteIds }})
    await Group.destroy({ where: { id: groupsToDeleteIds }})
    await thisUser.removeFriend(friend)
}