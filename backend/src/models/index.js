import { defineUser } from "./User.js";
import { defineTuition } from "./Tuition.js";
import { definePayment } from "./Payment.js";
import { definePaymentClone } from "./paymentClone.js";
import { definePaymentCloneTrash } from "./PaymentCloneTrash.js";
import { definePaymentCloneTeamB } from "./PaymentCloneTeamB.js";
import { definePaymentCloneTrashTeamB } from "./PaymentCloneTrashTeamB.js";
import defineTodayDemo from "./TodayDemo.js";
import { defineUserPresence } from "./UserPresence.js";
import { defineOtmTuitionEntry } from "./OtmTuitionEntry.js";
import { defineOtmPortalReport } from "./OtmPortalReport.js";
import { defineOtmClassTime } from "./OtmClassTime.js";
import { defineOtmTotalClass } from "./OtmTotalClass.js";
import { definePaymentChangeRequest } from "./PaymentChangeRequest.js";
import { defineChatGroup } from "./ChatGroup.js";
import { defineChatGroupMember } from "./ChatGroupMember.js";
import { defineChatMessage } from "./ChatMessage.js";
import { defineChatMessageSeen } from "./ChatMessageSeen.js";
export function initModels(sequelize) {
  const User = defineUser(sequelize);
  const Tuition = defineTuition(sequelize);
  const Payment = definePayment(sequelize);
  const PaymentClone = definePaymentClone(sequelize);
  const PaymentCloneTrash = definePaymentCloneTrash(sequelize);
  const PaymentCloneTeamB = definePaymentCloneTeamB(sequelize);
  const PaymentCloneTrashTeamB = definePaymentCloneTrashTeamB(sequelize);
  const TodayDemo = defineTodayDemo(sequelize);
  const UserPresence = defineUserPresence(sequelize);
  const OtmTuitionEntry = defineOtmTuitionEntry(sequelize);
  const OtmPortalReport = defineOtmPortalReport(sequelize);
  const OtmClassTime = defineOtmClassTime(sequelize);
  const OtmTotalClass = defineOtmTotalClass(sequelize);
  const PaymentChangeRequest = definePaymentChangeRequest(sequelize);

  const ChatGroup = defineChatGroup(sequelize);
  const ChatGroupMember = defineChatGroupMember(sequelize);
  const ChatMessage = defineChatMessage(sequelize);
  const ChatMessageSeen = defineChatMessageSeen(sequelize);

  UserPresence.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(UserPresence, { foreignKey: "userId", as: "presences" });

  OtmTuitionEntry.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(OtmTuitionEntry, { foreignKey: "userId", as: "otmEntries" });

  OtmPortalReport.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(OtmPortalReport, { foreignKey: "userId", as: "otmReports" });

  OtmTotalClass.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(OtmTotalClass, { foreignKey: "userId", as: "otmTotalClasses" });

  PaymentChangeRequest.belongsTo(User, { foreignKey: "actorUserId", as: "actorUser" });
  PaymentChangeRequest.belongsTo(User, { foreignKey: "approvedBy", as: "approvedByUser" });
  PaymentChangeRequest.belongsTo(User, { foreignKey: "rejectedBy", as: "rejectedByUser" });
  PaymentChangeRequest.belongsTo(PaymentClone, { foreignKey: "paymentCloneId", as: "paymentClone" });
  PaymentChangeRequest.belongsTo(PaymentCloneTeamB, { foreignKey: "paymentCloneTeamBId", as: "paymentCloneTeamB" });
  ChatGroup.hasMany(ChatGroupMember, { foreignKey: "groupId", as: "members" });
  ChatGroupMember.belongsTo(ChatGroup, { foreignKey: "groupId", as: "group" });

  User.hasMany(ChatGroupMember, { foreignKey: "userId", as: "chatMemberships" });
  ChatGroupMember.belongsTo(User, { foreignKey: "userId", as: "memberUser" });

  ChatGroup.hasMany(ChatMessage, { foreignKey: "groupId", as: "messages" });
  ChatMessage.belongsTo(ChatGroup, { foreignKey: "groupId", as: "group" });

  User.hasMany(ChatMessage, { foreignKey: "senderId", as: "sentChatMessages" });
  ChatMessage.belongsTo(User, { foreignKey: "senderId", as: "sender" });

  ChatMessage.hasMany(ChatMessageSeen, { foreignKey: "messageId", as: "seenBy" });
  ChatMessageSeen.belongsTo(ChatMessage, { foreignKey: "messageId", as: "message" });

  User.hasMany(ChatMessageSeen, { foreignKey: "userId", as: "chatSeenRows" });
  ChatMessageSeen.belongsTo(User, { foreignKey: "userId", as: "seenUser" });

  return {
    User,
    Tuition,
    Payment,
    PaymentClone,
    PaymentCloneTrash,
    PaymentCloneTeamB,
    PaymentCloneTrashTeamB,
    TodayDemo,
    Target: TodayDemo,
    UserPresence,
    OtmTuitionEntry,
    OtmPortalReport,
    OtmClassTime,
    OtmTotalClass,
    PaymentChangeRequest,
    ChatGroup,
    ChatGroupMember,
    ChatMessage,
    ChatMessageSeen,
  };
}