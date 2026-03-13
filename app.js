const express = require('express')
const exphbs = require('express-handlebars')
const sessions = require('express-session')
const flash = require('express-flash')
const fileStore = require('session-file-store')(sessions)
const path = require('path')
const app = express()

const auth = require ("./src/router/login")
const conn = require('./src/db/conn')

const hbs = exphbs.create({
    defaultLayout: "main",
    helpers: {
        eq: (a, b) => a === b,
    },
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "src", "views"));
app.use(express.static("public"));

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(express.json());

app.use(
    sessions({
        name: "session",
        secret: "nosso_secret",
        resave: false,
        saveUninitialized: false,
        store: new fileStore({
            logFn: function () { },
            path: require("path").join(require("os").tmpdir(), "sessions"),
        }),
    })
);

app.use(flash());

//app.use(SessionMiddleware)

app.use("/", auth)

app.get("/", (req, res, next) => {
    res.render("index")
})

conn
    .sync({ force: true })
    .then(() => {
        app.listen(3000);
    })
    .catch((err) => {
        console.log(err);
    })