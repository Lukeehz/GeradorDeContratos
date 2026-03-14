const { Contrato, User } = require('../models/index')
const { cpf } = require('cpf-cnpj-validator')
const PDFDocument = require('pdfkit')
const { Op } = require('sequelize')
const path = require('path')
const fs = require('fs')

const pastaContratos = path.join(__dirname, '../../public/contratos')
if (!fs.existsSync(pastaContratos)) fs.mkdirSync(pastaContratos, { recursive: true })

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

            doc.font('Helvetica').text('_________________________________', { align: 'left' })
            doc.font('Helvetica-Bold').text(nomeContratante, { continued: true })
            doc.font('Helvetica').text(' — CONTRATANTE')
            doc.moveDown(2)
            doc.text('_________________________________', { align: 'left' })
            doc.text('________________________________ — CONTRATADO(A)')

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
}