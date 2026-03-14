const express = require('express')
const router = express.Router()
const appController = require('../controllers/appController')
const { checkAuth } = require('../middlewares/auth')

router.get('/home', checkAuth, appController.home)
router.get('/contratos', checkAuth, appController.listarContratos)
router.get('/contratos/novo', checkAuth, appController.novoContratoGet)
router.post('/contratos/novo', checkAuth, appController.novoContrato)
router.get('/contratos/:id/download', checkAuth, appController.downloadContrato)

module.exports = router