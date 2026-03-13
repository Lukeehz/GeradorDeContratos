const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

//GETS
//router.get('/login', authController.loginGet)

//POSTS
router.post('/login', authController.login)
 router.post('/register', authController.register)


 module.exports = router