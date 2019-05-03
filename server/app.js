const express = require('express')
const handlebars = require('express-handlebars')
const path = require('path')
const cookieParser = require('cookie-parser')

const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(cookieParser())

app.use(express.static(path.join(__dirname, '/public')))

app.engine("handlebars", handlebars({ 
    defaultLayout: "main",
}))
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "handlebars")

app.get('/', (req, res) => {
    if (req.cookies['jwt']) {
        return res.render('index', { loggedIn: true })
    }
    res.render('index')
})

app.use('/users', require('./routes/users'))
app.use('/dashboard', require('./routes/dashboard'))

module.exports = app