const { Contrato, Documento, User } = require('../models/index')
const { cpf } = require('cpf-cnpj-validator')
const PDFDocument = require('pdfkit')
const { PDFDocument: PDFLib, rgb, StandardFonts } = require('pdf-lib')
const { Op } = require('sequelize')
const path = require('path')
const fs = require('fs')

const pastaContratos = path.join(__dirname, '../../public/contratos')
const pastaDocumentos = path.join(__dirname, '../../public/documentos')

if (!fs.existsSync(pastaContratos)) fs.mkdirSync(pastaContratos, { recursive: true })
if (!fs.existsSync(pastaDocumentos)) fs.mkdirSync(pastaDocumentos, { recursive: true })

async function getLocals(req) {
    const user = await User.findByPk(req.session.userId)
    if (!user) return null
    return {
        userName: `${user.name} ${user.midName}`,
        userInitials: `${user.name[0]}${user.surName[0]}`,
        isModerator: user.role === 'moderator',
        user
    }
}

module.exports = class appController {

    // ─── GET ─────────────────────────────────────────────────────────────────

    // GET DE HOME
    static async home(req, res) {
        const locals = await getLocals(req)
        if (!locals) {
            req.flash('error_msg', 'Sessão expirada, faça login novamente')
            return res.redirect('/')
        }

        const contratos = await Contrato.findAll({
            where: { userID: req.session.userId },
            order: [['createdAt', 'DESC']],
            limit: 5
        })

        const lista = contratos.map(c => ({
            id: c.id,
            tipo: c.tipo,
            data: c.createdAt.toLocaleDateString('pt-BR')
        }))

        res.render('home', {
            layout: 'main',
            title: 'Home',
            isHome: true,
            contratos: lista,
            ...locals,
            messages: req.flash()
        })
    }

    // GET DE NOVO CONTRATO
    static async novoContratoGet(req, res) {
        const locals = await getLocals(req)
        if (!locals) return res.redirect('/')

        res.render('contrato/novo', {
            layout: 'main',
            title: 'Novo Contrato',
            isContratos: true,
            ...locals,
            messages: req.flash()
        })
    }

    // GET DE LISTAR CONTRATOS
    static async listarContratos(req, res) {
        const locals = await getLocals(req)
        if (!locals) return res.redirect('/')

        try {
            const { dataInicio, dataFim } = req.query
            const where = { userID: req.session.userId }

            if (dataInicio || dataFim) {
                where.createdAt = {}
                if (dataInicio) where.createdAt[Op.gte] = new Date(dataInicio + 'T00:00:00')
                if (dataFim)    where.createdAt[Op.lte] = new Date(dataFim + 'T23:59:59')
            }

            const contratos = await Contrato.findAll({ where, order: [['createdAt', 'DESC']] })

            const lista = contratos.map(c => ({
                id: c.id,
                tipo: c.tipo,
                arquivo: c.arquivo,
                data: c.createdAt.toLocaleDateString('pt-BR')
            }))

            res.render('contrato/lista', {
                layout: 'main',
                title: 'Meus Contratos',
                pageSubtitle: 'Gerencie e baixe seus contratos',
                isContratos: true,
                contratos: lista,
                dataInicio: dataInicio || '',
                dataFim: dataFim || '',
                ...locals,
                messages: req.flash()
            })
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao carregar contratos')
            return res.redirect('/home')
        }
    }

    // GET DE DOWNLOAD CONTRATO
    static async downloadContrato(req, res) {
        try {
            const contrato = await Contrato.findOne({
                where: { id: req.params.id, userID: req.session.userId }
            })

            if (!contrato) {
                req.flash('error_msg', 'Contrato não encontrado')
                return res.redirect('/contratos')
            }

            const filePath = path.join(pastaContratos, contrato.arquivo)

            if (!fs.existsSync(filePath)) {
                req.flash('error_msg', 'Arquivo não encontrado')
                return res.redirect('/contratos')
            }

            res.download(filePath, contrato.arquivo)
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao baixar contrato')
            return res.redirect('/contratos')
        }
    }

    // GET DE LISTAR DOCUMENTOS
    static async listarDocumentos(req, res) {
        const locals = await getLocals(req)
        if (!locals) return res.redirect('/')

        try {
            const documentos = await Documento.findAll({
                where: { userID: req.session.userId },
                order: [['createdAt', 'DESC']]
            })

            const lista = documentos.map(d => ({
                id: d.id,
                nomeOriginal: d.nomeOriginal,
                assinado: d.assinado,
                arquivo: d.assinado ? d.arquivoAssinado : d.arquivoOriginal,
                data: d.createdAt.toLocaleDateString('pt-BR')
            }))

            res.render('documento/lista', {
                layout: 'main',
                title: 'Documentos',
                pageSubtitle: 'Importe e assine documentos',
                isDocumentos: true,
                documentos: lista,
                ...locals,
                messages: req.flash()
            })
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao carregar documentos')
            return res.redirect('/home')
        }
    }

    // GET DE IMPORTAR DOCUMENTO
    static async importarGet(req, res) {
        const locals = await getLocals(req)
        if (!locals) return res.redirect('/')

        res.render('documento/importar', {
            layout: 'main',
            title: 'Importar Documento',
            pageSubtitle: 'Faça upload de um PDF para assinar',
            isDocumentos: true,
            ...locals,
            messages: req.flash()
        })
    }

    // GET DE DOWNLOAD DOCUMENTO
    static async downloadDocumento(req, res) {
        try {
            const doc = await Documento.findOne({
                where: { id: req.params.id, userID: req.session.userId }
            })

            if (!doc) {
                req.flash('error_msg', 'Documento não encontrado')
                return res.redirect('/documentos')
            }

            const arquivo = doc.assinado ? doc.arquivoAssinado : doc.arquivoOriginal
            const filePath = path.join(pastaDocumentos, arquivo)

            if (!fs.existsSync(filePath)) {
                req.flash('error_msg', 'Arquivo não encontrado')
                return res.redirect('/documentos')
            }

            res.download(filePath, arquivo)
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao baixar documento')
            return res.redirect('/documentos')
        }
    }

    // ─── POST ────────────────────────────────────────────────────────────────

    // POST DE NOVO CONTRATO
    static async novoContrato(req, res) {
        const { tipo, tituloCustom, clausulaTitulo, clausulaTexto } = req.body

        if (!tipo) {
            req.flash('error_msg', 'Selecione o tipo de contrato')
            return res.redirect('/contratos/novo')
        }

        if (tipo === 'outro' && !tituloCustom) {
            req.flash('error_msg', 'Digite o título do contrato')
            return res.redirect('/contratos/novo')
        }

        if (!clausulaTitulo || !clausulaTexto || clausulaTitulo.length === 0) {
            req.flash('error_msg', 'Adicione ao menos uma cláusula')
            return res.redirect('/contratos/novo')
        }

        try {
            const user = await User.findByPk(req.session.userId)

            if (!user) {
                req.flash('error_msg', 'Sessão expirada, faça login novamente')
                return res.redirect('/')
            }

            const nomeContratante = `${user.name} ${user.midName} ${user.surName}`
            const titulo = tipo === 'outro' ? tituloCustom.toUpperCase() : tipo

            const titulos  = Array.isArray(clausulaTitulo) ? clausulaTitulo : [clausulaTitulo]
            const textos   = Array.isArray(clausulaTexto)  ? clausulaTexto  : [clausulaTexto]
            const clausulas = titulos.map((t, i) => ({ titulo: t, texto: textos[i] || '' }))

            const nomeArquivo = `contrato_${req.session.userId}_${Date.now()}.pdf`
            const filePath = path.join(pastaContratos, nomeArquivo)

            await Contrato.create({
                userID: req.session.userId,
                tipo: titulo,
                objeto: clausulas.map(c => `${c.titulo}\n${c.texto}`).join('\n\n'),
                arquivo: nomeArquivo
            })

            const doc = new PDFDocument({ margin: 60 })
            const stream = fs.createWriteStream(filePath)
            doc.pipe(stream)

            doc.font('Helvetica-Bold').fontSize(16).text(titulo, { align: 'center' })
            doc.moveDown(2)

            doc.font('Helvetica').fontSize(12).text('Eu, ', { continued: true })
            doc.font('Helvetica-Bold').text(nomeContratante, { continued: true })
            doc.font('Helvetica').text(', portador(a) do CPF ', { continued: true })
            doc.font('Helvetica-Bold').text(cpf.format(user.cpf), { continued: true })
            doc.font('Helvetica').text(
                ', doravante denominado(a) CONTRATANTE, e ' +
                '_______________________________, ' +
                'portador(a) do CPF _____________________, ' +
                'doravante denominado(a) CONTRATADO(A), ' +
                'têm entre si justo e contratado o seguinte:',
                { align: 'justify' }
            )
            doc.moveDown(1.5)

            clausulas.forEach(c => {
                doc.font('Helvetica-Bold').fontSize(12).text(c.titulo)
                doc.moveDown(0.5)
                doc.font('Helvetica').text(c.texto, { align: 'justify' })
                doc.moveDown(1.5)
            })

            doc.moveDown(1.5)

            const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
            doc.text(`Assinado em ${hoje}.`, { align: 'right' })
            doc.moveDown(3)

            // Assinaturas manuais
            doc.moveDown(1)
            doc.font('Helvetica-Bold').text(nomeContratante + '  ', { continued: true })
            doc.font('Helvetica').text('_________________________________')
            doc.moveDown(1.5)
            doc.font('Helvetica-Bold').text('CONTRATADO(A)  ', { continued: true })
            doc.font('Helvetica').text('_________________________________')

            doc.end()

            stream.on('finish', () => {
                res.download(filePath, nomeArquivo)
            })

            stream.on('error', (err) => {
                console.log(err)
                req.flash('error_msg', 'Erro ao salvar contrato')
                return res.redirect('/contratos/novo')
            })

        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro interno')
            return res.redirect('/contratos/novo')
        }
    }

    // POST DE IMPORTAR DOCUMENTO
    static async importarPost(req, res) {
        if (!req.file) {
            req.flash('error_msg', 'Selecione um arquivo PDF')
            return res.redirect('/documentos/importar')
        }

        try {
            await Documento.create({
                userID: req.session.userId,
                nomeOriginal: req.file.originalname,
                arquivoOriginal: req.file.filename,
                assinado: false
            })

            req.flash('success_msg', 'Documento importado com sucesso')
            return res.redirect('/documentos')
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao importar documento')
            return res.redirect('/documentos/importar')
        }
    }

    // POST DE ASSINAR DOCUMENTO
    static async assinar(req, res) {
        try {
            const user = await User.findByPk(req.session.userId)
            if (!user) return res.redirect('/login')

            const doc = await Documento.findOne({
                where: { id: req.params.id, userID: req.session.userId }
            })

            if (!doc) {
                req.flash('error_msg', 'Documento não encontrado')
                return res.redirect('/documentos')
            }

            const arquivoBase = doc.assinado ? doc.arquivoAssinado : doc.arquivoOriginal
            const filePath = path.join(pastaDocumentos, arquivoBase)
            const pdfBytes = fs.readFileSync(filePath)

            const pdfDoc = await PDFLib.load(pdfBytes)
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

            const nomeCompleto = `${user.name} ${user.midName} ${user.surName}`
            const cpfFormatado = cpf.format(user.cpf)
            const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

            const count = parseInt(doc.totalAssinaturas) || 0
            const alturaBloco = 80

            let pagina
            let startY

            if (count === 0) {
                // Primeira assinatura — sempre cria nova página
                pagina = pdfDoc.addPage([595, 842])
                const { width } = pagina.getSize()

                pagina.drawText('Assinaturas Digitais', {
                    x: 60, y: 780, size: 13, font: fontBold,
                    color: rgb(0.2, 0.2, 0.2)
                })
                pagina.drawLine({
                    start: { x: 60, y: 768 },
                    end: { x: width - 60, y: 768 },
                    thickness: 0.5,
                    color: rgb(0.7, 0.7, 0.7)
                })

                startY = 740
            } else {
                // Assinaturas seguintes — usa a última página (já é a de assinaturas)
                const pages = pdfDoc.getPages()
                pagina = pages[pages.length - 1]
                startY = 740 - (count * alturaBloco)

                // Se não couber mais, cria nova página
                if (startY < 60) {
                    pagina = pdfDoc.addPage([595, 842])
                    startY = 740
                }
            }

            const { width } = pagina.getSize()

            pagina.drawText(`Assinado em ${hoje}`, {
                x: 60, y: startY, size: 10, font,
                color: rgb(0.4, 0.4, 0.4)
            })

            pagina.drawLine({
                start: { x: 60, y: startY - 15 },
                end: { x: 280, y: startY - 15 },
                thickness: 0.8,
                color: rgb(0.3, 0.3, 0.3)
            })

            pagina.drawText(nomeCompleto, {
                x: 60, y: startY - 28, size: 11, font: fontBold,
                color: rgb(0.1, 0.1, 0.1)
            })

            pagina.drawText(`CPF: ${cpfFormatado}`, {
                x: 60, y: startY - 41, size: 10, font,
                color: rgb(0.3, 0.3, 0.3)
            })

            pagina.drawText('Assinado digitalmente', {
                x: 60, y: startY - 54, size: 9, font,
                color: rgb(0.5, 0.5, 0.5)
            })

            const nomeAssinado = `assinado_${doc.arquivoOriginal}`
            const filePathAssinado = path.join(pastaDocumentos, nomeAssinado)
            const pdfBytesAssinado = await pdfDoc.save()
            fs.writeFileSync(filePathAssinado, pdfBytesAssinado)

            await doc.update({
                arquivoAssinado: nomeAssinado,
                assinado: true,
                totalAssinaturas: count + 1
            })

            req.flash('success_msg', 'Documento assinado com sucesso')
            return res.redirect('/documentos')

        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao assinar documento')
            return res.redirect('/documentos')
        }
    }
}