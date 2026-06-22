require("dotenv").config();
const { Sequelize } = require("sequelize");

console.log("\n🔍 Testing MySQL Database Connection...\n");

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

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ MySQL Connection Successful!");
    console.log(`   Host: ${process.env.DB_HOST || "localhost"}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   User: ${process.env.DB_USER || "root"}`);
    console.log(`   Database: ${process.env.DB_NAME || "hospital"}`);
    console.log("\n✅ All database settings are correct!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ MySQL Connection Failed!");
    console.error(`   Error: ${error.message}`);
    console.error("\nPossible Issues:");
    console.error("1. MySQL is not running in XAMPP");
    console.error("2. Database 'hospital' does not exist");
    console.error("3. Incorrect credentials in .env file");
    console.error("\nTo fix:");
    console.error("1. Start MySQL in XAMPP Control Panel");
    console.error("2. Create database: CREATE DATABASE hospital;");
    console.error("3. Check .env file for correct credentials");
    process.exit(1);
  });
