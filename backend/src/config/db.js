import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

let sequelizeInstance = null;

export function makeSequelize() {
  if (sequelizeInstance) {
    return sequelizeInstance;
  }

  const {
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
  } = process.env;

  if (!DB_NAME || !DB_USER) {
    throw new Error(
      "Database configuration missing. Check DB_NAME and DB_USER in .env"
    );
  }

  sequelizeInstance = new Sequelize(
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    {
      host: DB_HOST || "localhost",
      port: DB_PORT ? Number(DB_PORT) : 3306,
      dialect: "mysql",
      logging: false,
      timezone: "+00:00",

      dialectOptions: {
        dateStrings: true,
        typeCast: true,
      },

      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );

  return sequelizeInstance;
}
const sequelize = makeSequelize();

export { sequelize };
export default sequelize;