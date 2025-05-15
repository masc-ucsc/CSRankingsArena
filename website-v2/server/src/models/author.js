'use strict';
module.exports = (sequelize, DataTypes) => {
  const Author = sequelize.define('Author', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {});
  
  Author.associate = function(models) {
    Author.belongsToMany(models.Paper, {
      through: 'PaperAuthors',
      as: 'papers',
      foreignKey: 'authorId'
    });
  };
  
  return Author;
};