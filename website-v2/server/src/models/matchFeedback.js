const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class MatchFeedback extends Model {
    static associate(models) {
      MatchFeedback.hasMany(models.Comment, {
        foreignKey: 'matchFeedbackId',
        as: 'Comments'
      });
    }
  }

  MatchFeedback.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    matchId: {
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
    modelName: 'MatchFeedback',
    tableName: 'match_feedback',
    timestamps: true
  });

  return MatchFeedback;
}; 