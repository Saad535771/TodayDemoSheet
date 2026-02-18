import { defineUser } from "./User.js";
import { defineTuition } from "./Tuition.js";

export function initModels(sequelize) {
  const User = defineUser(sequelize);
  const Tuition = defineTuition(sequelize);

  // (no relations needed right now)
  return { User, Tuition };
}
