'use strict';
module.exports = (sequelize, DataTypes) => {
  const ArxivCategory = sequelize.define('ArxivCategory', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subcategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {});
  
  ArxivCategory.associate = function(models) {
    ArxivCategory.belongsTo(models.Subcategory, {
      foreignKey: 'subcategoryId',
      as: 'subcategory'
    });
  };
  
  return ArxivCategory;
};