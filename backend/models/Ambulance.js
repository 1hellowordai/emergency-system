const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Ambulance = sequelize.define(
    "Ambulance",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hospital_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("Available", "On Call", "Unavailable"),
        allowNull: false,
        defaultValue: "Available",
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      driver_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      plate_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "ambulances",
      underscored: true,
    }
  );

  return Ambulance;
};
