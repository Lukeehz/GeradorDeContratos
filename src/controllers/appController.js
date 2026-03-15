const { Contrato, Documento, DocumentoAssinante, User } = require('../models/index')
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
            const userId = req.session.userId

            // Documentos próprios
            const proprios = await Documento.findAll({
                where: { userID: userId },
                order: [['createdAt', 'DESC']]
            })

            // Documentos onde é assinante
            const assinaturas = await DocumentoAssinante.findAll({
                where: { userID: userId },
                include: [{ model: Documento }]
            })

            const idsJaListados = proprios.map(d => d.id)
            const compartilhados = assinaturas
                .map(a => a.Documento)
                .filter(d => d && !idsJaListados.includes(d.id))

            const todos = [...proprios, ...compartilhados]

            const lista = todos.map(d => ({
                id: d.id,
                nomeOriginal: d.nomeOriginal,
                assinado: d.assinado,
                arquivo: d.assinado ? d.arquivoAssinado : d.arquivoOriginal,
                data: d.createdAt.toLocaleDateString('pt-BR'),
                isDono: d.userID === userId
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
                where: { id: req.params.id }
            })

            if (!doc) {
                req.flash('error_msg', 'Documento não encontrado')
                return res.redirect('/documentos')
            }

            // Verifica se é o dono ou um assinante
            const isDono = doc.userID === req.session.userId
            const isAssinante = await DocumentoAssinante.findOne({
                where: { documentoID: doc.id, userID: req.session.userId }
            })

            if (!isDono && !isAssinante) {
                req.flash('error_msg', 'Acesso negado')
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

    // GET DE COMPARTILHAR DOCUMENTO
    static async compartilharGet(req, res) {
        const locals = await getLocals(req)
        if (!locals) return res.redirect('/')

        try {
            const doc = await Documento.findOne({
                where: { id: req.params.id, userID: req.session.userId }
            })

            if (!doc) {
                req.flash('error_msg', 'Documento não encontrado')
                return res.redirect('/documentos')
            }

            // Todos os usuários exceto o dono
            const todosUsuarios = await User.findAll({
                where: { id: { [require('sequelize').Op.ne]: req.session.userId } },
                attributes: ['id', 'name', 'midName', 'surName', 'email']
            })

            // Quem já tem compartilhamento
            const jaCompartilhados = await DocumentoCompartilhado.findAll({
                where: { documentoID: doc.id }
            })
            const idsCompartilhados = jaCompartilhados.map(c => c.userID)

            const usuarios = todosUsuarios.map(u => ({
                id: u.id,
                nomeCompleto: `${u.name} ${u.midName} ${u.surName}`,
                email: u.email,
                jaCompartilhado: idsCompartilhados.includes(u.id)
            }))

            res.render('documento/compartilhar', {
                layout: 'main',
                title: 'Compartilhar Documento',
                documentoId: doc.id,
                nomeDocumento: doc.nomeOriginal,
                usuarios,
                ...locals,
                messages: req.flash()
            })
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao carregar usuários')
            return res.redirect('/documentos')
        }
    }

    // POST DE COMPARTILHAR DOCUMENTO
    static async compartilharPost(req, res) {
        try {
            const doc = await Documento.findOne({
                where: { id: req.params.id, userID: req.session.userId }
            })

            if (!doc) {
                req.flash('error_msg', 'Documento não encontrado')
                return res.redirect('/documentos')
            }

            const userIDs = req.body.userIDs
            if (!userIDs) {
                req.flash('error_msg', 'Selecione ao menos um usuário')
                return res.redirect(`/documentos/${doc.id}/compartilhar`)
            }

            const ids = Array.isArray(userIDs) ? userIDs : [userIDs]

            for (const uid of ids) {
                const jaExiste = await DocumentoCompartilhado.findOne({
                    where: { documentoID: doc.id, userID: uid }
                })
                if (!jaExiste) {
                    await DocumentoCompartilhado.create({
                        documentoID: doc.id,
                        userID: uid
                    })
                }
            }

            req.flash('success_msg', 'Documento compartilhado com sucesso')
            return res.redirect('/documentos')
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao compartilhar documento')
            return res.redirect('/documentos')
        }
    }
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
                where: { id: req.params.id }
            })

            if (!doc) {
                req.flash('error_msg', 'Documento não encontrado')
                return res.redirect('/documentos')
            }

            // Verifica se é dono ou foi compartilhado
            const isDono = doc.userID === req.session.userId
            const isCompartilhado = await DocumentoAssinante.findOne({
                where: { documentoID: doc.id, userID: req.session.userId }
            })

            if (!isDono && !isCompartilhado) {
                req.flash('error_msg', 'Sem permissão para assinar este documento')
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
            const alturaBloco = 90
            const topoConteudo = 740
            const margemMin = 60
            const porPagina = Math.floor((topoConteudo - margemMin) / alturaBloco)
            const indexNaPagina = count % porPagina
            const startY = topoConteudo - (indexNaPagina * alturaBloco)

            let pagina

            if (count === 0) {
                pagina = pdfDoc.addPage([595, 842])
                const { width } = pagina.getSize()
                pagina.drawText('Assinaturas Digitais', {
                    x: 60, y: 800, size: 14, font: fontBold,
                    color: rgb(0.15, 0.15, 0.15)
                })
                pagina.drawLine({
                    start: { x: 60, y: 788 },
                    end: { x: width - 60, y: 788 },
                    thickness: 0.5,
                    color: rgb(0.75, 0.75, 0.75)
                })
            } else if (indexNaPagina === 0) {
                pagina = pdfDoc.addPage([595, 842])
                const { width } = pagina.getSize()
                pagina.drawText('Assinaturas Digitais (continuação)', {
                    x: 60, y: 800, size: 14, font: fontBold,
                    color: rgb(0.15, 0.15, 0.15)
                })
                pagina.drawLine({
                    start: { x: 60, y: 788 },
                    end: { x: width - 60, y: 788 },
                    thickness: 0.5,
                    color: rgb(0.75, 0.75, 0.75)
                })
            } else {
                const pages = pdfDoc.getPages()
                pagina = pages[pages.length - 1]
            }

            const { width } = pagina.getSize()

            if (indexNaPagina > 0) {
                pagina.drawLine({
                    start: { x: 60, y: startY + 15 },
                    end: { x: width - 60, y: startY + 15 },
                    thickness: 0.3,
                    color: rgb(0.85, 0.85, 0.85)
                })
            }

            pagina.drawText(`Assinado em ${hoje}`, {
                x: 60, y: startY, size: 10, font,
                color: rgb(0.4, 0.4, 0.4)
            })

            pagina.drawLine({
                start: { x: 60, y: startY - 16 },
                end: { x: 280, y: startY - 16 },
                thickness: 0.8,
                color: rgb(0.3, 0.3, 0.3)
            })

            pagina.drawText(nomeCompleto, {
                x: 60, y: startY - 30, size: 11, font: fontBold,
                color: rgb(0.1, 0.1, 0.1)
            })

            pagina.drawText(`CPF: ${cpfFormatado}`, {
                x: 60, y: startY - 44, size: 10, font,
                color: rgb(0.3, 0.3, 0.3)
            })

            pagina.drawText('Assinado digitalmente', {
                x: 60, y: startY - 57, size: 9, font,
                color: rgb(0.55, 0.55, 0.55)
            })

            const nomeAssinado = `assinado_${doc.arquivoOriginal}`
            const filePathAssinado = path.join(pastaDocumentos, nomeAssinado)
            const pdfBytesAssinado = await pdfDoc.save()
            fs.writeFileSync(filePathAssinado, pdfBytesAssinado)

            // Atualiza o documento principal
            await doc.update({
                arquivoAssinado: nomeAssinado,
                assinado: true,
                totalAssinaturas: count + 1
            })

            // Registra o assinante apenas se ainda não estiver registrado
            const jaRegistrado = await DocumentoAssinante.findOne({
                where: { documentoID: doc.id, userID: req.session.userId }
            })
            if (!jaRegistrado) {
                await DocumentoAssinante.create({
                    documentoID: doc.id,
                    userID: req.session.userId
                })
            }

            req.flash('success_msg', 'Documento assinado com sucesso')
            return res.redirect('/documentos')

        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao assinar documento')
            return res.redirect('/documentos')
        }
    }

    // ─── GET DE COMPARTILHAR DOCUMENTO ───────────────────────────────────────
    static async compartilharGet(req, res) {
        const locals = await getLocals(req)
        if (!locals) return res.redirect('/login')

        try {
            const doc = await Documento.findOne({
                where: { id: req.params.id, userID: req.session.userId }
            })

            if (!doc) {
                req.flash('error_msg', 'Documento não encontrado')
                return res.redirect('/documentos')
            }

            // Lista todos os usuários exceto o dono
            const usuarios = await User.findAll({
                where: { id: { [Op.ne]: req.session.userId } },
                attributes: ['id', 'name', 'midName', 'surName', 'email']
            })

            // Já compartilhados
            const jaCompartilhados = await DocumentoAssinante.findAll({
                where: { documentoID: doc.id }
            })
            const idsJaCompartilhados = jaCompartilhados.map(c => c.userID)

            const lista = usuarios.map(u => ({
                id: u.id,
                nomeCompleto: `${u.name} ${u.midName} ${u.surName}`,
                email: u.email,
                jaCompartilhado: idsJaCompartilhados.includes(u.id)
            }))

            res.render('documento/compartilhar', {
                layout: 'main',
                title: 'Compartilhar Documento',
                pageSubtitle: doc.nomeOriginal,
                isDocumentos: true,
                documentoId: doc.id,
                usuarios: lista,
                ...locals,
                messages: req.flash()
            })
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao carregar usuários')
            return res.redirect('/documentos')
        }
    }

    // ─── POST DE COMPARTILHAR DOCUMENTO ──────────────────────────────────────
    static async compartilharPost(req, res) {
        const { usuarioId } = req.body

        try {
            const doc = await Documento.findOne({
                where: { id: req.params.id, userID: req.session.userId }
            })

            if (!doc) {
                req.flash('error_msg', 'Documento não encontrado')
                return res.redirect('/documentos')
            }

            // Verifica se já foi compartilhado
            const jaExiste = await DocumentoAssinante.findOne({
                where: { documentoID: doc.id, userID: usuarioId }
            })

            if (jaExiste) {
                req.flash('error_msg', 'Documento já compartilhado com este usuário')
                return res.redirect(`/documentos/${doc.id}/compartilhar`)
            }

            await DocumentoAssinante.create({
                documentoID: doc.id,
                userID: usuarioId
            })

            req.flash('success_msg', 'Documento compartilhado com sucesso')
            return res.redirect('/documentos')

        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao compartilhar documento')
            return res.redirect('/documentos')
        }
    }
}