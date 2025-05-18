const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class LeaderboardFeedback extends Model {
    static associate(models) {
      LeaderboardFeedback.hasMany(models.Comment, {
        foreignKey: 'leaderboardFeedbackId',
        as: 'Comments'
      });
    }
  }

  LeaderboardFeedback.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    matchId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    paperId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dislikes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'LeaderboardFeedback',
    tableName: 'leaderboard_feedback',
    timestamps: true
  });

  return LeaderboardFeedback;
}; 