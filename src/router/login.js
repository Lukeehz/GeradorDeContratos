const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const checkModerator = require('../middlewares/checkModerator')
const { checkAuth } = require('../middlewares/auth')

// ─── GET ─────────────────────────────────────────────────────────────────────
router.get('/login', authController.loginGet)
router.get('/logout', authController.logout)
router.get('/trocar-senha', checkAuth, authController.trocarSenhaGet)
router.get('/usuarios', checkAuth, checkModerator, authController.listar)
router.get('/usuarios/novo', checkAuth, checkModerator, authController.novoUsuarioGet)

// ─── POST ────────────────────────────────────────────────────────────────────
router.post('/login', authController.login)
router.post('/register', authController.register)
router.post('/trocar-senha', checkAuth, authController.trocarSenhaPost)
router.post('/usuarios/novo', checkAuth, checkModerator, authController.novoUsuarioPost)
router.post('/usuarios/:id/deletar', checkAuth, checkModerator, authController.deletarUsuario)

module.exports = router