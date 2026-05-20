import { makeSequelize } from "../src/config/db.js";

async function checkDB() {
  const sequelize = makeSequelize();
  try {
    const [results] = await sequelize.query("SHOW DATABASES;");
    console.log("Databases found:");
    results.forEach(db => console.log(` - ${db.Database}`));
    
    console.log("\nCurrent DB Name in .env:", process.env.DB_NAME);
  } catch (err) {
    console.error("Failed to connect or list databases:", err.message);
  } finally {
    await sequelize.close();
  }
}

checkDB();
