const express = require('express')
const router = express.Router()
const appController = require('../controllers/appController')
const { checkAuth } = require('../middlewares/auth')
const upload = require('../middlewares/upload')

router.get('/home', checkAuth, appController.home)
router.get('/contratos', checkAuth, appController.listarContratos)
router.get('/contratos/novo', checkAuth, appController.novoContratoGet)
router.post('/contratos/novo', checkAuth, appController.novoContrato)
router.get('/contratos/:id/download', checkAuth, appController.downloadContrato)

router.get('/documentos', checkAuth, appController.listarDocumentos)
router.get('/documentos/importar', checkAuth, appController.importarGet)
router.post('/documentos/importar', checkAuth, upload.single('arquivo'), appController.importarPost)
router.post('/documentos/:id/assinar', checkAuth, appController.assinar)
router.get('/documentos/:id/download', checkAuth, appController.downloadDocumento)
router.get('/documentos/:id/compartilhar', checkAuth, appController.compartilharGet)
router.post('/documentos/:id/compartilhar', checkAuth, appController.compartilharPost)

module.exports = router