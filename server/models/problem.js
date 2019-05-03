module.exports = (sequelize, DataTypes) => {
    const Problem = sequelize.define('Problem', {
        question: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        answer: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    })
    Problem.associate = models => {
        Problem.belongsTo(models.Guide, { 
            as: 'guide',
            foreignKey: {
                allowNull: false,
                onDelete: 'CASCADE'
            }
        })
    }
    return Problem
}