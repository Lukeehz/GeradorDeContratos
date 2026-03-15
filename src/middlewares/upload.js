const multer = require('multer')
const path = require('path')
const fs = require('fs')

const pastaUploads = path.join(__dirname, '../../public/documentos')
if (!fs.existsSync(pastaUploads)) fs.mkdirSync(pastaUploads, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pastaUploads)
    },
    filename: (req, file, cb) => {
        const nome = `doc_${Date.now()}_${file.originalname.replace(/\s/g, '_')}`
        cb(null, nome)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true)
    } else {
        cb(new Error('Apenas arquivos PDF são permitidos'), false)
    }
}

module.exports = multer({ storage, fileFilter })