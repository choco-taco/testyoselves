module.exports = (sequelize, DataTypes) => {
    const Token = sequelize.define('Token', {
        type: {
            type: DataTypes.ENUM,
            values: ['verify', 'reset'],
            allowNull: false
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false
        }
    })
    Token.associate = models => {
        Token.belongsTo(models.User, { as: 'user', onDelete: 'CASCADE' })
    }
    return Token
}