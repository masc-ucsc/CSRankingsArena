'use strict';
module.exports = (sequelize, DataTypes) => {
  const Subcategory = sequelize.define('Subcategory', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {});
  
  Subcategory.associate = function(models) {
    Subcategory.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    
    Subcategory.hasMany(models.ArxivCategory, {
      foreignKey: 'subcategoryId',
      as: 'arxivCategories'
    });
  };
  
  return Subcategory;
};