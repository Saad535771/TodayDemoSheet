import { defineUser } from "./User.js";
import { defineTuition } from "./Tuition.js";
import { definePayment } from "./Payment.js";
import { defineUserPresence } from "./UserPresence.js";

export function initModels(sequelize) {
  const User = defineUser(sequelize);
  const Tuition = defineTuition(sequelize);
  const Payment = definePayment(sequelize);
  const UserPresence = defineUserPresence(sequelize);

  User.hasMany(UserPresence, { foreignKey: "userId", as: "presences" });
  UserPresence.belongsTo(User, { foreignKey: "userId", as: "user" });

  return { User, Tuition, Payment, UserPresence };
}