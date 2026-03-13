const User = require("../models/user");
const bcrypt = require("bcrypt");
const { cpf } = require('cpf-cnpj-validator');
const validator = require('validator');
const salt = 10;

module.exports = class authController {

    //POST Register
    static async register(req, res) {
        const { name, midName, surName, email, password, confirmPassword, cpf: cpfUser } = req.body;

        // Senhas iguais
        if (password !== confirmPassword) {
            req.flash("error_msg", "As senhas não são iguais");
            return res.json({ error: "As senhas nao sao iguais" });
        }

        // Email válido
        if (!validator.isEmail(email)) {
            req.flash("error_msg", "Email inválido");
            return res.json({ error: "Email inválido" });
        }

        // Senha forte
        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 0
        })) {
            req.flash("error_msg", "Senha fraca. Use 8 caracteres, número, maiúscula e minúscula");
            return res.json({ error: "Senha fraca. Use 8 caracteres, número, maiúscula e minúscula" });
        }

        // Verifica se email já existe
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            req.flash("error_msg", "Email já cadastrado");
            return res.json({ error: "Email ja cadastrado" });
        }

        // Valida CPF
        if (!cpf.isValid(cpfUser)) {
            req.flash("error_msg", "CPF inválido");
            return res.json({ error: "CPF inválido" });
        }

        try {
            const hash = await bcrypt.hash(password, salt);

            const user = await User.create({
                name,
                midName,
                surName,   // agora bate com o campo do modelo
                email,
                password: hash,
                cpf: cpfUser
            });

            // Salva sessão
            req.session.userId = user.id;
            req.flash("success_msg", "Cadastro realizado com sucesso");
            req.session.save(err => {
                if (err) {
                    console.log(err);
                    req.flash("error_msg", "Erro interno");
                    return res.redirect("/register");
                }
                return res.json({ success: "Cadastro realizado com sucesso" });
            });
        } catch (err) {
            console.log(`Erro: ${err}`);
            req.flash("error_msg", "Erro interno");
            return res.redirect("/register");
        }
    }

    //POST Login
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ where: { email } });
            if (!user) {
                req.flash("error_msg", "Usuário não cadastrado!");
                return res.json({ error: "Usuário nao cadastrado" });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                req.flash("error_msg", "Senha incorreta");
                return res.json({ error: "Senha incorreta" });
            }

            req.session.userId = user.id;
            req.flash("success_msg", "Login realizado com sucesso");

            req.session.save(err => {
                if (err) {
                    console.log(err);
                    req.flash("error_msg", "Erro interno");
                    return res.redirect("/login");
                }
                return res.json({ success: "Login realizado com sucesso" });
            });
        } catch (err) {
            console.log(`Erro: ${err}`);
            req.flash("error_msg", "Erro interno");
            return res.redirect("/login");
        }
    }

};