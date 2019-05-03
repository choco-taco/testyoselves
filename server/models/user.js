const bcrypt = require('bcryptjs')

module.exports = (sequelize, DataTypes) => {
    let User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING(25),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        hooks: {
            beforeCreate: async (user) => {
                // Turn username and email to lowercase
                user.username = user.username.toLowerCase()
                user.email = user.email.toLowerCase()

                // Hash user password before saving to database
                try {
                    // Generate a salt
                    const salt = await bcrypt.genSalt(10);
                    const hash = await bcrypt.hash(user.password, salt)
                    console.log('Password', user.password)
                    console.log('Hashed password', hash)
                    user.password = hash
                } catch (error) {
                    throw new Error(error)
                }

            }
        }
    })
    User.associate = models => {
        User.belongsToMany(models.User, { 
            as: 'Friends', 
            through: 'friends' 
        });
        User.belongsToMany(models.User, { 
            as: 'Requestees', 
            through: 'friendRequests', 
            foreignKey: 'requesterId', 
            onDelete: 'CASCADE' 
        });
        User.belongsToMany(models.User, { 
            as: 'Requesters', 
            through: 'friendRequests', 
            foreignKey: 'requesteeId', 
            onDelete: 'CASCADE' 
        });
    }
    User.prototype.isValidPassword = async function(newPassword) {
        try {
            return await bcrypt.compare(newPassword, this.password)
        } catch (error) {
            throw new Error(error)
        }
    }
    return User
}