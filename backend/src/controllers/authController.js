import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

export function makeAuthController({ User, UserPresence }) {
  const normalizeEmail = (email) => email?.trim().toLowerCase();
  const normalizeName = (name) => {
    const value = name?.trim();
    return value ? value : null;
  };

  const toBoolInt = (value) => {
    return value === true || value === 1 || value === "1" || value === "true" ? 1 : 0;
  };

  const getTrashAccessByRole = (role, requestedAccess = 0) => {
    if (role === "admin") return 1;
    if (role === "hod") return 0;
    return requestedAccess ? 1 : 0;
  };

 const getPaymentSheetPermissions = ({
  role,
  access_payment_sheet = 0,
  access_tutor_share = 0,
  access_lacas_share = 0,
  access_total_fees = 0,
  access_payment_actions = 0,
  access_payment_sheet_clone_team_b = 0,
  access_tutor_share_clone_team_b = 0,
  access_lacas_share_clone_team_b = 0,
  access_total_fees_clone_team_b = 0,
  access_payment_actions_clone_team_b = 0,
}) => {
  if (role === "admin") {
    return {
      accessPaymentSheet: 1,
      accessTutorShare: 1,
      accessLacasShare: 1,
      accessTotalFees: 1,
      accessPaymentActions: 1,
      accessPaymentSheetCloneTeamB: 1,
      accessTutorShareCloneTeamB: 1,
      accessLacasShareCloneTeamB: 1,
      accessTotalFeesCloneTeamB: 1,
      accessPaymentActionsCloneTeamB: 1,
    };
  }

  const paymentSheetAccess = toBoolInt(access_payment_sheet);
const paymentSheetCloneTeamBAccess = toBoolInt(access_payment_sheet_clone_team_b);
  if (!paymentSheetAccess) {
    return {
      accessPaymentSheet: paymentSheetAccess,
    accessTutorShare: paymentSheetAccess ? toBoolInt(access_tutor_share) : 0,
    accessLacasShare: paymentSheetAccess ? toBoolInt(access_lacas_share) : 0,
    accessTotalFees: paymentSheetAccess ? toBoolInt(access_total_fees) : 0,
    accessPaymentActions: paymentSheetAccess ? toBoolInt(access_payment_actions) : 0,
    
    accessPaymentSheetCloneTeamB: paymentSheetCloneTeamBAccess,
    accessTutorShareCloneTeamB: paymentSheetCloneTeamBAccess ? toBoolInt(access_tutor_share_clone_team_b) : 0,
    accessLacasShareCloneTeamB: paymentSheetCloneTeamBAccess ? toBoolInt(access_lacas_share_clone_team_b) : 0,
    accessTotalFeesCloneTeamB: paymentSheetCloneTeamBAccess ? toBoolInt(access_total_fees_clone_team_b) : 0,
    accessPaymentActionsCloneTeamB: paymentSheetCloneTeamBAccess ? toBoolInt(access_payment_actions_clone_team_b) : 0,
    };
  }

  return {
    accessPaymentSheet: 1,
    accessTutorShare: toBoolInt(access_tutor_share),
    accessLacasShare: toBoolInt(access_lacas_share),
    accessTotalFees: toBoolInt(access_total_fees),
    accessPaymentActions: toBoolInt(access_payment_actions),
  };
};

  const formatUser = (user) => ({
    id: user.id,
    name: user.name || null,
    email: user.email,
    role: user.role,
    access_monthly: user.accessMonthly,
    access_demo: user.accessDemo,
    access_trash: user.accessTrash,
    access_payment_sheet: user.accessPaymentSheet,
    access_tutor_share: user.accessTutorShare,
    access_lacas_share: user.accessLacasShare,
    access_total_fees: user.accessTotalFees,
 access_payment_actions: user.accessPaymentActions,
 
 access_payment_sheet_clone_team_b: user.accessPaymentSheetCloneTeamB,
    access_tutor_share_clone_team_b: user.accessTutorShareCloneTeamB,
    access_lacas_share_clone_team_b: user.accessLacasShareCloneTeamB,
    access_total_fees_clone_team_b: user.accessTotalFeesCloneTeamB,
    access_payment_actions_clone_team_b: user.accessPaymentActionsCloneTeamB,
    access_trash_clone_team_b: user.accessTrashCloneTeamB,

    access_hod_approvals: user.accessHodApprovals,
    access_staff: user.accessStaff,
    access_otm_management: user.accessOtmManagement,
     access_chat: user.accessChat,
  access_chat_send: user.accessChatSend,
  });

  async function createOrUpdatePresence({
    userId,
    sessionId,
    currentSheet = "dashboard",
    req,
    resetLoginAt = false
  }) {
    if (!sessionId) return;

    const now = new Date();

    const existing = await UserPresence.findOne({
      where: { sessionId }
    });

    if (existing) {
      await existing.update({
        userId,
        currentSheet,
        isOnline: 1,
        lastSeenAt: now,
        loginAt: resetLoginAt ? now : existing.loginAt,
        userAgent: req.headers["user-agent"] || null,
        ipAddress: req.ip || null
      });
      return;
    }

    await UserPresence.create({
      userId,
      sessionId,
      currentSheet,
      isOnline: 1,
      loginAt: now,
      lastSeenAt: now,
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip || null
    });
  }

  return {
    async login(req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role, session_id } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({ where: { email: normalizedEmail } });

        if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const ok = await bcrypt.compare(password, user.passwordHash);

        if (!ok) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.role !== role) {
          return res.status(403).json({
            message: `Your Account Already Register ${user.role}. Please Use ${user.role} Login`
          });
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role, name: user.name || null },
          process.env.JWT_SECRET
        );

        if (session_id) {
          await createOrUpdatePresence({
            userId: user.id,
            sessionId: session_id,
            currentSheet: "dashboard",
            req,
            resetLoginAt: true
          });
        }

        return res.json({
          token,
          user: formatUser(user)
        });
      } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Server error during login" });
      }
    },

    async register(req, res) {
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Access denied. Only Admins can create staff." });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, role } = req.body;
      const normalizedName = normalizeName(name);
      const normalizedEmail = normalizeEmail(email);
      const finalRole = role || "staff";

      try {
        const existing = await User.findOne({ where: { email: normalizedEmail } });
        if (existing) {
          return res.status(400).json({ message: "User already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const paymentPermissions = getPaymentSheetPermissions({
          role: finalRole,
          access_payment_sheet: 0,
          access_tutor_share: 0,
          access_lacas_share: 0,
          access_total_fees: 0,
          access_payment_actions: 0,
        });

        const newUser = await User.create({
          name: normalizedName,
          email: normalizedEmail,
          passwordHash,
          role: finalRole,
          accessMonthly: 1,
          accessDemo: 1,
          accessTrash: getTrashAccessByRole(finalRole, 0),
          accessPaymentSheet: paymentPermissions.accessPaymentSheet,
          accessTutorShare: paymentPermissions.accessTutorShare,
          accessLacasShare: paymentPermissions.accessLacasShare,
          accessTotalFees: paymentPermissions.accessTotalFees,
         accessPaymentActions: paymentPermissions.accessPaymentActions,
          accessChat: finalRole === "admin" ? 1 : 0,
  accessChatSend: finalRole === "admin" ? 1 : 0,
        });

        return res.json({
          message: "User created successfully",
          userId: newUser.id
        });
      } catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ message: "Server error creating user" });
      }
    },

    async me(req, res) {
      try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        return res.json({
          user: formatUser(user)
        });
      } catch (err) {
        console.error("ME ERROR:", err);
        return res.status(500).json({ message: "Error fetching profile" });
      }
    },

    async listUsers(req, res) {
      // Allow any logged-in user to see the list (needed for chat)
      try {
        const users = await User.findAll({
          order: [["createdAt", "DESC"]]
        });

        const formattedUsers = users.map((u) => ({
          ...formatUser(u),
          createdAt: u.createdAt
        }));

        return res.json({ users: formattedUsers });
      } catch (e) {
        console.error("LIST USERS ERROR:", e);
        return res.status(500).json({ message: "Error fetching users" });
      }
    },

    async getUserDetails(req, res) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const user = await User.findByPk(req.params.userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        return res.json({ user: formatUser(user) });
      } catch (e) {
        console.error("GET USER DETAILS ERROR:", e);
        return res.status(500).json({ message: "Error fetching user details" });
      }
    },

    async updatePermissions(req, res) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId } = req.params;
      const {
        access_monthly,
        access_demo,
        access_trash,
        access_payment_sheet,
        access_tutor_share,
        access_lacas_share,
        access_total_fees,
       access_payment_actions,
        access_hod_approvals,
        access_staff,
        access_otm_management,
        access_chat,
  access_chat_send
      } = req.body;

      try {
        const user = await User.findByPk(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const trashAccess = getTrashAccessByRole(user.role, access_trash);

        const paymentPermissions = getPaymentSheetPermissions({
          role: user.role,
          access_payment_sheet,
          access_tutor_share,
          access_lacas_share,
          access_total_fees,
          access_payment_actions,
        });

        await User.update(
          {
            accessMonthly: toBoolInt(access_monthly),
            accessDemo: toBoolInt(access_demo),
            accessTrash: trashAccess,
            accessPaymentSheet: paymentPermissions.accessPaymentSheet,
            accessTutorShare: paymentPermissions.accessTutorShare,
            accessLacasShare: paymentPermissions.accessLacasShare,
            accessTotalFees: paymentPermissions.accessTotalFees,
            accessPaymentActions: paymentPermissions.accessPaymentActions,
            accessHodApprovals: toBoolInt(access_hod_approvals),
            accessStaff: toBoolInt(access_staff),
            accessOtmManagement: toBoolInt(access_otm_management),
            accessChat: user.role === "admin" ? 1 : toBoolInt(access_chat),
             accessChatSend:user.role === "admin"? 1 : toBoolInt(access_chat) === 1  
              ? toBoolInt(access_chat_send) : 0,
          },
          { where: { id: userId } }
        );

        return res.json({
          success: true,
          message: "Permissions updated"
        });
      } catch (e) {
        console.error("UPDATE PERMISSIONS ERROR:", e);
        return res.status(500).json({ message: "Error updating permissions" });
      }
    },

    async deleteUser(req, res) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId } = req.params;

      if (parseInt(userId, 10) === req.user.id) {
        return res.status(400).json({ message: "Cannot delete yourself" });
      }

      try {
        const deleted = await User.destroy({ where: { id: userId } });

        if (!deleted) {
          return res.status(404).json({ message: "User not found" });
        }

        return res.json({
          success: true,
          message: "User deleted"
        });
      } catch (e) {
        console.error("DELETE USER ERROR:", e);
        return res.status(500).json({ message: "Error deleting user" });
      }
    },

    async presenceHeartbeat(req, res) {
      try {
        const { session_id, current_sheet } = req.body;

        if (!session_id) {
          return res.status(400).json({ message: "session_id is required" });
        }

        await createOrUpdatePresence({
          userId: req.user.id,
          sessionId: session_id,
          currentSheet: current_sheet || "dashboard",
          req,
          resetLoginAt: false
        });

        return res.json({
          success: true,
          message: "Presence updated"
        });
      } catch (e) {
        console.error("PRESENCE HEARTBEAT ERROR:", e);
        return res.status(500).json({ message: "Failed to update presence" });
      }
    },

    async presenceLogout(req, res) {
      try {
        const { session_id } = req.body;

        if (!session_id) {
          return res.status(400).json({ message: "session_id is required" });
        }

        await UserPresence.update(
          {
            isOnline: 0,
            lastSeenAt: new Date()
          },
          {
            where: {
              userId: req.user.id,
              sessionId: session_id
            }
          }
        );

        return res.json({
          success: true,
          message: "User marked offline"
        });
      } catch (e) {
        console.error("PRESENCE LOGOUT ERROR:", e);
        return res.status(500).json({ message: "Failed to mark offline" });
      }
    },

    async activeUsers(req, res) {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      try {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

        const rows = await UserPresence.findAll({
          where: {
            isOnline: 1,
            lastSeenAt: {
              [Op.gte]: oneMinuteAgo
            }
          },
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email", "role"]
            }
          ],
          order: [["lastSeenAt", "DESC"]]
        });

        const users = rows.map((row) => ({
          id: row.id,
          user_id: row.userId,
          name: row.user?.name || "",
          email: row.user?.email || "",
          role: row.user?.role || "",
          current_sheet: row.currentSheet,
          login_at: row.loginAt,
          last_seen_at: row.lastSeenAt,
          is_online: !!row.isOnline,
          session_id: row.sessionId
        }));

        return res.json({ users });
      } catch (e) {
        console.error("ACTIVE USERS ERROR:", e);
        return res.status(500).json({ message: "Failed to fetch active users" });
      }
    }
  };
}