const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const checkModerator = require('../middlewares/userLocals')
const { checkAuth } = require('../middlewares/auth')

// GETS
router.get('/login', authController.loginGet)
router.get('/logout', authController.logout)

// POSTS
router.post('/login', authController.login)
router.post('/register', authController.register)

router.get('/trocar-senha', checkAuth, authController.trocarSenhaGet)
router.post('/trocar-senha', checkAuth, authController.trocarSenhaPost)

// USUÁRIOS (só moderator)
router.get('/usuarios', checkAuth, checkModerator, authController.listar)
router.get('/usuarios/novo', checkAuth, checkModerator, authController.novoUsuarioGet)
router.post('/usuarios/novo', checkAuth, checkModerator, authController.novoUsuarioPost)
router.post('/usuarios/:id/deletar', checkAuth, checkModerator, authController.deletarUsuario)

module.exports = router