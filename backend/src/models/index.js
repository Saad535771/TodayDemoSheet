import { defineUser } from "./User.js";
import { defineTuition } from "./Tuition.js";
import { definePayment } from "./Payment.js";
import { definePaymentClone } from "./paymentClone.js";
import { definePaymentCloneTrash } from "./PaymentCloneTrash.js";
import defineTodayDemo from "./TodayDemo.js";
import { defineUserPresence } from "./UserPresence.js";
import { defineOtmTuitionEntry } from "./OtmTuitionEntry.js";
import { definePaymentChangeRequest } from "./PaymentChangeRequest.js";
export function initModels(sequelize) {
  const User = defineUser(sequelize);
  const Tuition = defineTuition(sequelize);
  const Payment = definePayment(sequelize);
  const PaymentClone = definePaymentClone(sequelize);
  const PaymentCloneTrash = definePaymentCloneTrash(sequelize);
  const TodayDemo = defineTodayDemo(sequelize);
  const UserPresence = defineUserPresence(sequelize);
  const OtmTuitionEntry = defineOtmTuitionEntry(sequelize);
  const PaymentChangeRequest = definePaymentChangeRequest(sequelize);

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

  PaymentChangeRequest.belongsTo(User, {
  foreignKey: "actorUserId",
  as: "actorUser",
});

PaymentChangeRequest.belongsTo(User, {
  foreignKey: "approvedBy",
  as: "approvedByUser",
});

PaymentChangeRequest.belongsTo(User, {
  foreignKey: "rejectedBy",
  as: "rejectedByUser",
});

PaymentChangeRequest.belongsTo(PaymentClone, {
  foreignKey: "paymentCloneId",
  as: "paymentClone",
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
    PaymentChangeRequest,
  };
}