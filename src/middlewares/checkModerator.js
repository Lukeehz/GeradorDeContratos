const { User } = require('../models/index')

module.exports = async (req, res, next) => {
    if (!req.session.userId) {
        req.flash('error_msg', 'Acesso negado')
        return res.redirect('/')
    }

    const user = await User.findByPk(req.session.userId)

    if (!user || user.role !== 'moderator') {
        req.flash('error_msg', 'Acesso negado')
        return res.redirect('/home')
    }

    next()
}