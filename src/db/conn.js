require('dotenv').config()

const { Sequelize } = require('sequelize')

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./db/user.sqlite"
})

module.exports = sequelize