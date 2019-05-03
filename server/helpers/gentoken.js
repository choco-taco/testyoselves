const crypto = require('crypto')

module.exports = () => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(48, (error, buffer) => {
            if (error) reject('Error generating token')
            resolve(buffer.toString('hex'));
        });
    });
}