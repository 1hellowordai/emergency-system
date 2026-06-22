const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CallAssignment = sequelize.define(
    "CallAssignment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      call_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ambulance_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      assigned_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: "call_assignments",
      underscored: true,
    }
  );

  return CallAssignment;
};
