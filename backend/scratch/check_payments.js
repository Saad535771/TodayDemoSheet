
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/sheet/backend/public_html/.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

const PaymentClone = sequelize.define('PaymentClone', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  tuitionId: { type: DataTypes.STRING, field: 'tuition_id' },
  tuitionName: { type: DataTypes.STRING, field: 'tuition_name' },
  paymentDate: { type: DataTypes.DATEONLY, field: 'payment_date' }
}, {
  tableName: 'payments_clone',
  timestamps: false
});

async function check() {
  try {
    const count = await PaymentClone.count();
    console.log(`TOTAL ROWS IN DB: ${count}`);
    
    const sample = await PaymentClone.findAll({ limit: 5 });
    console.log('SAMPLE DATA:', JSON.stringify(sample, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('DB ERROR:', err);
    process.exit(1);
  }
}

check();
