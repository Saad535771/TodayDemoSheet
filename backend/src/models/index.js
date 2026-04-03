import { defineUser } from "./User.js";
import { defineTuition } from "./Tuition.js";
import { definePayment } from "./Payment.js";
import { definePaymentClone } from "./paymentClone.js";
import { definePaymentCloneTrash } from "./PaymentCloneTrash.js";
import defineTodayDemo from "./TodayDemo.js";
import { defineUserPresence } from "./UserPresence.js";
import { defineOtmTuitionEntry } from "./OtmTuitionEntry.js";
export function initModels(sequelize) {
  const User = defineUser(sequelize);
  const Tuition = defineTuition(sequelize);
  const Payment = definePayment(sequelize);
  const PaymentClone = definePaymentClone(sequelize);
  const PaymentCloneTrash = definePaymentCloneTrash(sequelize);
  const TodayDemo = defineTodayDemo(sequelize);
  const UserPresence = defineUserPresence(sequelize);
  const OtmTuitionEntry = defineOtmTuitionEntry(sequelize);

  UserPresence.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  User.hasMany(UserPresence, {
    foreignKey: "userId",
    as: "presences",
  });
  OtmTuitionEntry.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  User.hasMany(OtmTuitionEntry, {
    foreignKey: "userId",
    as: "otmEntries",
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
    OtmTuitionEntry,
  };
}