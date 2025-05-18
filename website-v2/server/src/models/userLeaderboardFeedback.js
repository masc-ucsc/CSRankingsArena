const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserLeaderboardFeedback extends Model {
    static associate(models) {
      UserLeaderboardFeedback.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'User'
      });
    }
  }

  UserLeaderboardFeedback.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    matchId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    paperId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    liked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    disliked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'UserLeaderboardFeedback',
    tableName: 'user_leaderboard_feedback',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'matchId', 'paperId']
      }
    ]
  });

  return UserLeaderboardFeedback;
}; 