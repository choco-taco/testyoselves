module.exports = (sequelize, DataTypes) => {
    const Member = sequelize.define('Member')
    Member.associate = models => {
        Member.belongsTo(models.User, { 
            as: 'user',
            foreignKey: { allowNull: false }
        })
        Member.belongsTo(models.Group, { 
            as: 'group',
            foreignKey: { allowNull: false },
        })
    }
    return Member
}