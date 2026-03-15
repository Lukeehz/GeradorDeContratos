const User = require('../models/user')
const bcrypt = require('bcrypt')
const { cpf } = require('cpf-cnpj-validator')
const validator = require('validator')
const salt = 10

async function getLocals(req) {
    const user = await User.findByPk(req.session.userId)
    if (!user) return null
    return {
        userName: `${user.name} ${user.midName}`,
        userInitials: `${user.name[0]}${user.surName[0]}`,
        isModerator: user.role === 'moderator',
        isUsuarios: true
    }
}

module.exports = class authController {

    // ─── GET ─────────────────────────────────────────────────────────────────

    // GET DE LOGIN
    static loginGet(req, res) {
        if (req.session.userId) return res.redirect('/home')
        res.render('login', { layout: 'auth', title: 'Login', messages: req.flash() })
    }

    // GET DE TROCAR SENHA
    static trocarSenhaGet(req, res) {
        res.render('trocar-senha', { layout: 'auth', title: 'Trocar Senha', messages: req.flash() })
    }

    // GET DE LOGOUT
    static logout(req, res) {
        req.session.destroy(err => {
            if (err) console.log(err)
            return res.redirect('/login')
        })
    }

    // GET DE USUÁRIOS
    static async listar(req, res) {
        const locals = await getLocals(req)
        if (!locals) return res.redirect('/login')

        try {
            const usuarios = await User.findAll({
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'name', 'midName', 'surName', 'email', 'role', 'createdAt']
            })

            const lista = usuarios.map(u => ({
                id: u.id,
                nomeCompleto: `${u.name} ${u.midName} ${u.surName}`,
                email: u.email,
                role: u.role === 'moderator' ? 'Admin' : 'Usuário',
                data: u.createdAt.toLocaleDateString('pt-BR')
            }))

            res.render('usuarios/lista', {
                layout: 'main',
                title: 'Usuários',
                pageSubtitle: 'Gerencie os usuários do sistema',
                usuarios: lista,
                ...locals,
                messages: req.flash()
            })
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao carregar usuários')
            return res.redirect('/home')
        }
    }

    // GET DE NOVO USUÁRIO
    static async novoUsuarioGet(req, res) {
        const locals = await getLocals(req)
        if (!locals) return res.redirect('/login')

        res.render('usuarios/novo', {
            layout: 'main',
            title: 'Novo Usuário',
            pageSubtitle: 'Cadastre um novo usuário',
            ...locals,
            messages: req.flash()
        })
    }

    // ─── POST ────────────────────────────────────────────────────────────────

    // POST DE LOGIN
    static async login(req, res) {
        try {
            const { email, password } = req.body
            const user = await User.findOne({ where: { email } })

            if (!user) {
                req.flash('error_msg', 'Usuário não cadastrado!')
                return res.redirect('/login')
            }

            const passwordMatch = await bcrypt.compare(password, user.password)
            if (!passwordMatch) {
                req.flash('error_msg', 'Senha incorreta')
                return res.redirect('/login')
            }

            req.session.userId = user.id
            req.flash('success_msg', 'Login realizado com sucesso')
            req.session.save(err => {
                if (err) return res.redirect('/login')
                if (user.firstAcess) return res.redirect('/trocar-senha')
                return res.redirect('/home')
            })
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro interno')
            return res.redirect('/login')
        }
    }

    // POST DE REGISTER
    static async register(req, res) {
        const { name, midName, surName, email, password, confirmPassword, cpf: cpfUser } = req.body

        if (!name || !midName || !surName || !email || !password || !confirmPassword) {
            return res.json({ error: 'Preencha todos os campos' })
        }

        if (password !== confirmPassword) {
            req.flash('error_msg', 'As senhas não são iguais')
            return res.json({ error: 'As senhas nao sao iguais' })
        }
        if (!validator.isEmail(email)) {
            req.flash('error_msg', 'Email inválido')
            return res.json({ error: 'Email inválido' })
        }
        if (!validator.isStrongPassword(password, {
            minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0
        })) {
            req.flash('error_msg', 'Senha fraca. Use 8 caracteres, número, maiúscula e minúscula')
            return res.json({ error: 'Senha fraca' })
        }

        const userExists = await User.findOne({ where: { email } })
        if (userExists) {
            req.flash('error_msg', 'Email já cadastrado')
            return res.json({ error: 'Email ja cadastrado' })
        }
        if (!cpf.isValid(cpfUser)) {
            req.flash('error_msg', 'CPF inválido')
            return res.json({ error: 'CPF inválido' })
        }

        try {
            const hash = await bcrypt.hash(password, salt)
            const user = await User.create({
                name, midName, surName, email,
                password: hash,
                cpf: cpfUser,
                role: req.body.role || 'user'
            })

            req.session.userId = user.id
            req.session.save(err => {
                if (err) return res.json({ error: 'Erro interno' })
                return res.json({ success: 'Cadastro realizado com sucesso' })
            })
        } catch (err) {
            console.log(err)
            return res.json({ error: 'Erro interno' })
        }
    }

    // POST DE TROCAR SENHA
    static async trocarSenhaPost(req, res) {
        const { password, confirmPassword } = req.body

        if (password !== confirmPassword) {
            req.flash('error_msg', 'As senhas não são iguais')
            return res.redirect('/trocar-senha')
        }
        if (!validator.isStrongPassword(password, {
            minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0
        })) {
            req.flash('error_msg', 'Senha fraca. Use 8 caracteres, número, maiúscula e minúscula')
            return res.redirect('/trocar-senha')
        }

        try {
            const hash = await bcrypt.hash(password, salt)
            await User.update(
                { password: hash, firstAcess: false },
                { where: { id: req.session.userId } }
            )
            req.flash('success_msg', 'Senha alterada com sucesso')
            return res.redirect('/home')
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro interno')
            return res.redirect('/trocar-senha')
        }
    }

    // POST DE NOVO USUÁRIO
    static async novoUsuarioPost(req, res) {
        const { name, midName, surName, email, password, confirmPassword, cpf: cpfUser, role } = req.body

        if (password !== confirmPassword) {
            req.flash('error_msg', 'As senhas não são iguais')
            return res.redirect('/usuarios/novo')
        }
        if (!validator.isEmail(email)) {
            req.flash('error_msg', 'Email inválido')
            return res.redirect('/usuarios/novo')
        }
        if (!validator.isStrongPassword(password, {
            minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0
        })) {
            req.flash('error_msg', 'Senha fraca. Use 8 caracteres, número, maiúscula e minúscula')
            return res.redirect('/usuarios/novo')
        }
        if (cpfUser && !cpf.isValid(cpfUser)) {
            req.flash('error_msg', 'CPF inválido')
            return res.redirect('/usuarios/novo')
        }

        const userExists = await User.findOne({ where: { email } })
        if (userExists) {
            req.flash('error_msg', 'Email já cadastrado')
            return res.redirect('/usuarios/novo')
        }

        try {
            const hash = await bcrypt.hash(password, salt)
            await User.create({
                name, midName, surName, email,
                password: hash,
                cpf: cpfUser || null,
                role: role || 'user'
            })

            req.flash('success_msg', 'Usuário cadastrado com sucesso')
            return res.redirect('/usuarios')
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro interno')
            return res.redirect('/usuarios/novo')
        }
    }

    // POST DE DELETAR USUÁRIO
    static async deletarUsuario(req, res) {
        try {
            await User.destroy({ where: { id: req.params.id } })
            req.flash('success_msg', 'Usuário removido com sucesso')
            return res.redirect('/usuarios')
        } catch (err) {
            console.log(err)
            req.flash('error_msg', 'Erro ao remover usuário')
            return res.redirect('/usuarios')
        }
    }
}