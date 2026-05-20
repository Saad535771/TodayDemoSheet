import { makeSequelize } from "../src/config/db.js";
import { initModels } from "../src/models/index.js";

async function seed() {
  const sequelize = makeSequelize();
  const { TodayDemo } = initModels(sequelize);

  try {
    await sequelize.authenticate();
    console.log("Connected to database for seeding.");

    // Create tables if they don't exist
    await sequelize.sync();
    console.log("Database tables synchronized.");

    // Clear existing test data if any (optional, but good for clean tests)
    // await TodayDemo.destroy({ where: {} });

    const testData = [
      {
        tuitionId: "T-101",
        demoTime: "8:30 AM",
        timeHour: 8,
        tuitionName: "Ahmed Khan",
        source: "mahad",
        country: "Pakistan",
        parentsContact: "03001234567",
        className: "Class 10",
        subjects: "Mathematics",
        daysPerWeek: "3",
        tutorName: "Zahid Ali",
        tutorFee: "5000",
        status: "Pending",
        feedback: "Interested in morning slots",
        demoDate: new Date().toISOString().split('T')[0],
        demoRating: "Strong Demo",
        orderIndex: 1
      },
      {
        tuitionId: "T-102",
        demoTime: "9:15 AM",
        timeHour: 9,
        tuitionName: "Sarah Smith",
        source: "areeba",
        country: "UK",
        parentsContact: "+447712345678",
        className: "A Levels",
        subjects: "Physics, Chemistry",
        daysPerWeek: "2",
        tutorName: "Dr. Fatima",
        tutorFee: "150",
        status: "1st Demo Done",
        feedback: "Parents are satisfied with the methodology",
        demoDate: new Date().toISOString().split('T')[0],
        demoRating: "Average Demo",
        orderIndex: 1
      },
      {
        tuitionId: "T-103",
        demoTime: "10:00 AM",
        timeHour: 10,
        tuitionName: "John Doe",
        source: "sibgha",
        country: "USA",
        parentsContact: "+12025550101",
        className: "Grade 8",
        subjects: "English",
        daysPerWeek: "5",
        tutorName: "Michael Brown",
        tutorFee: "200",
        status: "Tuition Done",
        feedback: "Regular classes started",
        demoDate: new Date().toISOString().split('T')[0],
        demoRating: "Strong Demo",
        orderIndex: 1
      },
      {
        tuitionId: "T-104",
        demoTime: "8:45 AM",
        timeHour: 8,
        tuitionName: "Bilal Malik",
        source: "mahad",
        country: "Pakistan",
        parentsContact: "03129876543",
        className: "O Levels",
        subjects: "Computer Science",
        daysPerWeek: "4",
        tutorName: "Usman Ghani",
        tutorFee: "8000",
        status: "Pending",
        feedback: "Waitlisted for specific tutor",
        demoDate: new Date().toISOString().split('T')[0],
        demoRating: "Weak Demo",
        orderIndex: 2
      }
    ];

    for (const data of testData) {
      try {
        await TodayDemo.upsert(data);
        console.log(`Inserted/Updated record: ${data.tuitionName}`);
      } catch (err) {
        console.error(`Failed to insert ${data.tuitionName}:`, err.message);
      }
    }

    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await sequelize.close();
  }
}

seed();
