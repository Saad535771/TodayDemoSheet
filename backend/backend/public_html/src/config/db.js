import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

export function makeSequelize() {
  const {
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD
  } = process.env;

  return new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    dialect: "mysql",
    logging: false,
    timezone: "+00:00", // keep storage in UTC; we compute filters in app timezone
    dialectOptions: {
      dateStrings: true,
      typeCast: true
    }
  });
}
