const JWT = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/keys')

module.exports = user => {
    return JWT.sign({
        iss: 'Blog',
        sub: user.id,
        iat: new Date().getTime(),
        exp: new Date().setDate(new Date().getDate() + 1)
    }, JWT_SECRET);
}