const app = require('./app')
const db = require('./models')
const socket = require('socket.io')

const Session = db.Session
const Problem = db.Problem

db.sequelize.sync().then(() => {
    
    const PORT = process.env.PORT || 8080
    const server = app.listen(PORT, console.log(`Server started on port ${PORT}...`))
    const io = socket(server)

    let roomInfo = {}

    io.on('connection', socket => {

        socket.on('room', async data => {

            socket.room = data.sessionId
            socket.join(socket.room)

            socket.username = data.username
            socket.isLeader = data.isLeader

            socket.on('chat', data => {
                data.username = socket.username
                io.to(socket.room).emit('chat', data)
            })

            // If isLeader
            // Add room (sessionId), problems, 
            // index, currentTitle, currentText to roomInfo
            // Emit current question
            // Else
            // Emit an update event and passing current question
            if (socket.isLeader) {
        
                const problems = await Problem.findAll({
                    attributes: ['question', 'answer'],
                    where: {
                        guideId: data.guideId
                    },
                    raw: true
                })

                roomInfo[socket.room] = {
                    sessionId: data.sessionId,
                    problems,
                    index: 0,
                    currentTitle: 'Question',
                    currentText: problems[0].question,
                    leader: socket.id
                }
                io.to(socket.room).emit('update', {
                    index: 1, 
                    currentTitle: roomInfo[socket.room].currentTitle, 
                    currentText: roomInfo[socket.room].currentText
                })
                if (problems.length === 1) {
                    io.to(socket.id).emit('buttonDisplay', {
                        isFirst: true,
                        isLast: true
                    })
                } else {
                    io.to(socket.id).emit('buttonDisplay', {
                        isFirst: true,
                        isLast: false
                    })
                }
            } else {
                io.to(socket.room).emit('update', {
                    index: roomInfo[socket.room].index + 1,
                    currentTitle: roomInfo[socket.room].currentTitle,
                    currentText: roomInfo[socket.room].currentText
                })
            }
        })

        // Next event will increment the index
        // Find problem in array
        // Set currentTitle and currentText
        // And emit next question
        socket.on('next', () => {
            if (roomInfo[socket.room].index !== roomInfo[socket.room].problems.length-1 && socket.isLeader) {
                roomInfo[socket.room].index = roomInfo[socket.room].index + 1
                roomInfo[socket.room].currentTitle = 'Question'
                roomInfo[socket.room].currentText = roomInfo[socket.room].problems[roomInfo[socket.room].index].question
                io.to(socket.room).emit('update', {
                    index: roomInfo[socket.room].index + 1,
                    currentTitle: roomInfo[socket.room].currentTitle,
                    currentText: roomInfo[socket.room].currentText
                })
                if (roomInfo[socket.room].index !== roomInfo[socket.room].problems.length-1) {
                    io.to(socket.id).emit('buttonDisplay', {
                        isFirst: false,
                        isLast: false
                    })
                } else {
                    io.to(socket.id).emit('buttonDisplay', {
                        isFirst: false,
                        isLast: true
                    })
                }
            }
        })

        // Access the current problem with index,
        // Change currentTitle and currentText to the answers
        // Send back answers
        socket.on('show', () => {
            if (socket.isLeader) {
                roomInfo[socket.room].currentTitle = 'Answer'
                roomInfo[socket.room].currentText = roomInfo[socket.room].problems[roomInfo[socket.room].index].answer
                io.to(socket.room).emit('update', {
                    currentTitle: roomInfo[socket.room].currentTitle,
                    currentText: roomInfo[socket.room].currentText
                })
            }
        })

        // Previous event will decrement the index
        // Find problem in array
        // Set currentTitle and currentText
        // And emit the previous question
        socket.on('prev', () => {
            if (roomInfo[socket.room].index !== 0 && socket.isLeader) {
                roomInfo[socket.room].index = roomInfo[socket.room].index - 1
                roomInfo[socket.room].currentTitle = 'Question'
                roomInfo[socket.room].currentText = roomInfo[socket.room].problems[roomInfo[socket.room].index].question
                io.to(socket.room).emit('update', {
                    index: roomInfo[socket.room].index + 1,
                    currentTitle: roomInfo[socket.room].currentTitle,
                    currentText: roomInfo[socket.room].currentText
                })
                if (roomInfo[socket.room].index !== 0) {
                    io.to(socket.id).emit('buttonDisplay', {
                        isFirst: false,
                        isLast: false
                    })
                } else {
                    io.to(socket.id).emit('buttonDisplay', {
                        isFirst: true,
                        isLast: false
                    })
                }
            }
        })

        socket.on('disconnect', async () => {
            // If isLeader
            // Remove room property from object
            // Find Session model instance and change to false
            // Emit event that redirects users to dashboard
            if (socket.isLeader) {
                const foundSession = await Session.findOne({
                    where: {
                        id: socket.room
                    },
                })

                foundSession.active = false
                await foundSession.save()

                delete roomInfo[socket.room]

                io.to(socket.room).emit('end')

            }
            console.log(`User ${socket.userId} disconnected from room ${socket.room}`)
        })

    })
})

