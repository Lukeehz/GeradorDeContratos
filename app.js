require('dotenv').config()
const express = require('express')
const exphbs = require('express-handlebars')
const sessions = require('express-session')
const flash = require('express-flash')
const fileStore = require('session-file-store')(sessions)
const path = require('path')
const app = express()
const userLocals = require('./src/middlewares/userLocals')
const auth = require('./src/router/login')
const appRouter = require('./src/router/app')
const conn = require('./src/db/conn')
require('./src/models/index')

const hbs = exphbs.create({
    defaultLayout: 'main',
    helpers: {
        eq: (a, b) => a === b,
    },
})

app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'src', 'views'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(sessions({
    name: process.env.name_session,
    secret: process.env.secret_session,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
    store: new fileStore({
        logFn: function () {},
        path: path.join(__dirname, 'sessions'),
        ttl: 604800
    })
}))
app.use(flash())
app.use(userLocals)
app.use('/', auth)
app.use('/', appRouter)
app.get('/', (req, res) => {
    if (req.session.userId) return res.redirect('/home')
    res.render('login', { layout: 'auth', title: 'Login', messages: req.flash() })
})

conn
    .sync({ force: false })
    .then(() => {
        app.listen(3000)
        console.log('Servidor rodando na porta 3000')
    })
    .catch((err) => {
        console.log(err)
    })