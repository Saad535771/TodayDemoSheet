import { defineUser } from "./User.js";
import { defineTuition } from "./Tuition.js";
import { definePayment } from "./Payment.js";
import { definePaymentClone } from "./paymentClone.js";
import { definePaymentCloneTrash } from "./PaymentCloneTrash.js";
import defineTodayDemo from "./TodayDemo.js";
import { defineUserPresence } from "./UserPresence.js";

export function initModels(sequelize) {
  const User = defineUser(sequelize);
  const Tuition = defineTuition(sequelize);
  const Payment = definePayment(sequelize);
  const PaymentClone = definePaymentClone(sequelize);
  const PaymentCloneTrash = definePaymentCloneTrash(sequelize);
  const TodayDemo = defineTodayDemo(sequelize);
  const UserPresence = defineUserPresence(sequelize);

  UserPresence.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  User.hasMany(UserPresence, {
    foreignKey: "userId",
    as: "presences",
  });

  return {
    User,
    Tuition,
    Payment,
    PaymentClone,
    PaymentCloneTrash,
    TodayDemo,
    Target: TodayDemo,
    UserPresence,
  };
}