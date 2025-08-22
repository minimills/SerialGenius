import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMachineSchema, insertPanelSchema, insertOrderSchema } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware for authentication
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = data.user;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};

// Middleware for admin-only routes
const requireAdmin = (req: any, res: any, next: any) => {
  // Supabase users have `user_metadata`. You’ll store role there.
  if (req.user.user_metadata?.role !== "Admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Register with Supabase Auth
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, username, role } = req.body;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role: role || "Tech",
          },
        },
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.status(201).json(data.user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get logged-in user
  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    res.json(req.user);
  });

  // Countries routes
  app.get("/api/countries", authenticateToken, async (req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Machines routes
  app.get("/api/machines", authenticateToken, async (req, res) => {
    try {
      const machines = await storage.getMachines();
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/machines", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const machineData = insertMachineSchema.parse({
        ...req.body,
        addedBy: req.user.id,
      });
      const machine = await storage.createMachine(machineData);
      res.status(201).json(machine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/machines/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const machineData = insertMachineSchema.partial().parse(req.body);
      const machine = await storage.updateMachine(id, machineData);
      res.json(machine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/machines/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMachine(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Panels routes
  app.get("/api/panels", authenticateToken, async (req, res) => {
    try {
      const panels = await storage.getPanels();
      res.json(panels);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/machines/:machineId/panels", authenticateToken, async (req, res) => {
    try {
      const machineId = parseInt(req.params.machineId);
      const panels = await storage.getPanelsByMachine(machineId);
      res.json(panels);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/panels", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const panelData = insertPanelSchema.parse({
        ...req.body,
        addedBy: req.user.id,
      });
      const panel = await storage.createPanel(panelData);
      res.status(201).json(panel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/panels/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const panelData = insertPanelSchema.partial().parse(req.body);
      const panel = await storage.updatePanel(id, panelData);
      res.json(panel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/panels/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePanel(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Orders routes (unchanged, still protected by auth/admin)
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // (other order + serials routes stay as they were...)

  const httpServer = createServer(app);
  return httpServer;
}
