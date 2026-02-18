import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export function makeAuthController({ User }) {
  return {
    
    // --- 1. LOGIN ---
    async login(req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      
      const { email, password, role } = req.body; 
      
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });
      
      // ROLE RESTRICTION
      if (user.role !== role) {
        return res.status(403).json({ 
          message: `Aapka account as a ${user.role} register hai. Baraye meherbani ${user.role} login form use karein.` 
        });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      return res.json({
        token,
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          // Frontend ke liye snake_case keys bhejna zaroori hai
          access_monthly: user.accessMonthly, 
          access_demo: user.accessDemo,
          access_trash: user.accessTrash
        }
      });
    },

    // --- 2. REGISTER (New Staff) ---
    async register(req, res) {
      if (req.user.role !== 'admin') {
         return res.status(403).json({ message: "Access denied. Only Admins can create staff." });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password, role } = req.body;

      try {
        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ message: "User already exists" });

        const passwordHash = await bcrypt.hash(password, 10);

        // Model mein property names 'accessMonthly' (camelCase) hain
        const newUser = await User.create({
          email,
          passwordHash,
          role: role || 'staff',
          accessMonthly: 1, 
          accessDemo: 1,
          accessTrash: 0
        });

        res.json({ message: "User created successfully", userId: newUser.id });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error creating user" });
      }
    },

    // --- 3. ME (Get Profile & Permissions) ---
    async me(req, res) {
      const user = await User.findByPk(req.user.id);
      
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          access_monthly: user.accessMonthly,
          access_demo: user.accessDemo,
          access_trash: user.accessTrash
        } 
      });
    },

    // --- 4. LIST ALL USERS (Admin Only) ---
    async listUsers(req, res) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      try {
        const users = await User.findAll({
          order: [['createdAt', 'DESC']]
        });

        // Frontend ke toggles 'access_monthly' key expect karte hain
        const formattedUsers = users.map(u => ({
          id: u.id,
          email: u.email,
          role: u.role,
          access_monthly: u.accessMonthly,
          access_demo: u.accessDemo,
          access_trash: u.accessTrash,
          createdAt: u.createdAt
        }));

        res.json({ users: formattedUsers });
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error fetching users" });
      }
    },

    // --- 5. UPDATE PERMISSIONS (Show/Hide Sheets) ---
    async updatePermissions(req, res) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId } = req.params;
      const { access_monthly, access_demo, access_trash } = req.body;

      try {
        // Model property (accessMonthly) : Frontend value (access_monthly)
        await User.update(
          { 
            accessMonthly: access_monthly ? 1 : 0, 
            accessDemo: access_demo ? 1 : 0,
            accessTrash: access_trash ? 1 : 0
          },
          { where: { id: userId } }
        );
        res.json({ success: true, message: "Permissions updated" });
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error updating permissions" });
      }
    },

    // --- 6. DELETE USER ---
    async deleteUser(req, res) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { userId } = req.params;

      if (parseInt(userId) === req.user.id) {
          return res.status(400).json({ message: "Cannot delete yourself" });
      }

      try {
        const deleted = await User.destroy({ where: { id: userId } });
        if (!deleted) return res.status(404).json({ message: "User not found" });
        
        res.json({ success: true, message: "User deleted" });
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error deleting user" });
      }
    }
    
  };
}