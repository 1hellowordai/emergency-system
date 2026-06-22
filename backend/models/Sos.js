const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Sos = sequelize.define(
    "Sos",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      triage: {
        type: DataTypes.ENUM('light', 'medium', 'heavy'),
        allowNull: false,
        defaultValue: 'medium',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
      tableName: "sos_calls",
    }
  );

  return Sos;
};