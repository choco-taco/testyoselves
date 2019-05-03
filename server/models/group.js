module.exports = (sequelize, DataTypes) => {
    const Group = sequelize.define('Group', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    })
    Group.associate = models => {
        Group.belongsTo(models.User, { 
            as: 'leader',
            foreignKey: { allowNull: false }
        })
    }
    return Group
}