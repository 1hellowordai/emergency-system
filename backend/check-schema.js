require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "hospital",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
  }
);

(async () => {
  try {
    const result = await sequelize.query(`DESCRIBE users;`);
    console.log("Users table columns:");
    console.table(result[0]);
  } catch (error) {
    console.error("Error:", error.message);
  }
  process.exit(0);
})();
