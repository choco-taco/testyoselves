module.exports = (sequelize, DataTypes) => {
    const Session = sequelize.define('Session', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    })
    Session.associate = models => {
        Session.belongsTo(models.User, { 
            as: 'user',
            foreignKey: {
                allowNull: false
            }
        })
        Session.belongsTo(models.Group, { 
            as: 'group',
            foreignKey: {
                allowNull: false
            }
        })
        Session.belongsTo(models.Guide, { 
            as: 'guide',
            foreignKey: {
                allowNull: false
            }
        })
    }
    return Session
}