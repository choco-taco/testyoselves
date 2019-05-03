module.exports = (sequelize, DataTypes) => {
    const Guide = sequelize.define('Guide', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    })
    Guide.associate = models => {
        Guide.belongsTo(models.User, { 
            as: 'user',
            foreignKey: {
                allowNull: false
            }
         })
    }
    return Guide
}