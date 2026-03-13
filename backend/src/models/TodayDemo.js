import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TodayDemo = sequelize.define('TodayDemo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    original_tuition_id: DataTypes.STRING,
    tuition_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    demo_time: DataTypes.TIME,
    time_hour: DataTypes.INTEGER,
    tuition_name: DataTypes.STRING,
    source: DataTypes.STRING,
    country: DataTypes.STRING,
    parents_contact: DataTypes.STRING,
    class: DataTypes.STRING,
    subjects: DataTypes.STRING,
    tutor_name: DataTypes.STRING,
    tutor_fee: DataTypes.DECIMAL(12, 2),
    rejected_tutor: DataTypes.STRING,
    status: DataTypes.STRING,
    feedback: DataTypes.TEXT,
    demo_date: DataTypes.DATE,
    demo_rating: DataTypes.STRING,
    sync_flag: DataTypes.STRING,
    row_color: { type: DataTypes.STRING, defaultValue: '#ffffff' },
    tuition_name_color: { type: DataTypes.STRING, defaultValue: '#ffffff' },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    tableName: 'today_demo',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return TodayDemo;
};