const { User } = require('../models/index')

module.exports = async (req, res, next) => {
    if (req.session.userId && req.accepts('html')) {
        try {
            const user = await User.findByPk(req.session.userId)
            if (user) {
                res.locals.userName = `${user.name} ${user.midName}`
                res.locals.userInitials = `${user.name[0]}${user.surName[0]}`
                res.locals.isModerator = user.role === 'moderator'
            }
        } catch (err) {
            console.log(err)
        }
    }
    next()
}