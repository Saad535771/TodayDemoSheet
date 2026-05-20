"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("payments", "days_per_week", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("payments", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("payments", "days_per_week");
    await queryInterface.removeColumn("payments", "notes");
  },
};