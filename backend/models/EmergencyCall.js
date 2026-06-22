const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const EmergencyCall = sequelize.define(
    "EmergencyCall",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
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
      status: {
        type: DataTypes.ENUM("Pending", "On the Way", "Completed"),
        allowNull: false,
        defaultValue: "Pending",
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM("Low", "Medium", "High", "Critical"),
        allowNull: false,
        defaultValue: "Medium",
      },
      emergency_service_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Emergency service number (102-108) if this call was for a specific service",
      },
      patient_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      patient_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      patient_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      patient_info: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      nearest_hospital_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      triage: {
        type: DataTypes.ENUM("light", "heavy"),
        allowNull: false,
        defaultValue: "light",
        comment: "Call category: light (non-urgent) or heavy (urgent)",
      },
      queue_position: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Position in queue for light calls (null if dispatched or heavy)",
      },
      queue_assigned_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Timestamp when call moved from queue to dispatched",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      tableName: "emergency_calls",
      underscored: true,
    }
  );

  return EmergencyCall;
};
