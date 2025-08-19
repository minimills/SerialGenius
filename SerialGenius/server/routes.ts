import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { insertUserSchema, insertMachineSchema, insertPanelSchema, insertOrderSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware for admin-only routes
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Countries routes
  app.get("/api/countries", authenticateToken, async (req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Machines routes
  app.get("/api/machines", authenticateToken, async (req, res) => {
    try {
      const machines = await storage.getMachines();
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post("/api/machines", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const machineData = insertMachineSchema.parse({
        ...req.body,
        addedBy: req.user.id
      });
      const machine = await storage.createMachine(machineData);
      res.status(201).json(machine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
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
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete("/api/machines/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMachine(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Panels routes
  app.get("/api/panels", authenticateToken, async (req, res) => {
    try {
      const panels = await storage.getPanels();
      res.json(panels);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get("/api/machines/:machineId/panels", authenticateToken, async (req, res) => {
    try {
      const machineId = parseInt(req.params.machineId);
      const panels = await storage.getPanelsByMachine(machineId);
      res.json(panels);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post("/api/panels", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const panelData = insertPanelSchema.parse({
        ...req.body,
        addedBy: req.user.id
      });
      const panel = await storage.createPanel(panelData);
      res.status(201).json(panel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
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
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete("/api/panels/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePanel(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Orders routes
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post("/api/orders", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        addedBy: req.user.id
      });
      
      // Create order
      const order = await storage.createOrder(orderData);
      
      // Generate serial numbers for each machine and its panels
      const serialsToCreate = [];
      
      for (const machineOrder of orderData.machines) {
        const machine = await storage.getMachine(machineOrder.machineId);
        if (!machine) continue;
        
        // Generate serials for machine
        for (let i = 0; i < machineOrder.quantity; i++) {
          const lastSerial = await storage.getLastSerialByPrefix(machine.productCode);
          let nextNumber = 1;
          
          if (lastSerial) {
            const match = lastSerial.serialNumber.match(/(\d+)$/);
            if (match) {
              nextNumber = parseInt(match[1]) + 1;
            }
          }
          
          const serialNumber = `${machine.productCode}${nextNumber.toString().padStart(3, '0')}`;
          
          serialsToCreate.push({
            orderId: order.id,
            machineId: machine.id,
            serialNumber,
            addedBy: req.user.id
          });
        }
        
        // Generate serials for panels attached to this machine
        const panels = await storage.getPanelsByMachine(machineOrder.machineId);
        for (const panel of panels) {
          for (let i = 0; i < machineOrder.quantity; i++) {
            const lastSerial = await storage.getLastSerialByPrefix(panel.panelCode);
            let nextNumber = 1;
            
            if (lastSerial) {
              const match = lastSerial.serialNumber.match(/(\d+)$/);
              if (match) {
                nextNumber = parseInt(match[1]) + 1;
              }
            }
            
            const serialNumber = `${panel.panelCode}${nextNumber.toString().padStart(3, '0')}`;
            
            serialsToCreate.push({
              orderId: order.id,
              panelId: panel.id,
              serialNumber,
              addedBy: req.user.id
            });
          }
        }
      }
      
      // Create all serials
      if (serialsToCreate.length > 0) {
        await storage.createMultipleSerials(serialsToCreate);
      }
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch("/api/orders/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, orderData);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put("/api/orders/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, orderData);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete("/api/orders/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOrder(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Serials routes
  app.get("/api/serials", authenticateToken, async (req, res) => {
    try {
      const serials = await storage.getSerials();
      res.json(serials);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get("/api/orders/:orderId/serials", authenticateToken, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const serials = await storage.getSerialsByOrder(orderId);
      res.json(serials);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Seed data endpoint (for initial setup)
  app.post("/api/seed", async (req, res) => {
    try {
      // Add seed countries
      const seedCountries = [
        { name: "United States", code: "US" },
        { name: "Canada", code: "CA" },
        { name: "United Kingdom", code: "GB" },
        { name: "Germany", code: "DE" },
        { name: "France", code: "FR" }
      ];

      // Create admin user if not exists
      const adminExists = await storage.getUserByUsername("admin");
      let adminUser;
      if (!adminExists) {
        adminUser = await storage.createUser({
          username: "admin",
          email: "admin@company.com",
          phone: "+1-555-0101",
          password: "admin123",
          role: "Admin"
        });
      } else {
        adminUser = adminExists;
      }

      // Create tech user if not exists
      const techExists = await storage.getUserByUsername("tech");
      if (!techExists) {
        await storage.createUser({
          username: "tech",
          email: "tech@company.com",
          phone: "+1-555-0102",
          password: "tech123",
          role: "Tech"
        });
      }

      // Add sample machines
      const machines = [
        { name: "CNC Mill Pro X1", productCode: "CNC001", addedBy: adminUser.id },
        { name: "Laser Cutter LX200", productCode: "LSR200", addedBy: adminUser.id },
        { name: "3D Printer Z300", productCode: "3DP300", addedBy: adminUser.id }
      ];

      for (const machine of machines) {
        const existing = await storage.getMachines();
        if (!existing.find(m => m.productCode === machine.productCode)) {
          const newMachine = await storage.createMachine(machine);
          
          // Add panels for each machine
          const panelData = [
            { name: "Control Panel", panelCode: `CP${machine.productCode.slice(-3)}`, parentMachineId: newMachine.id, addedBy: adminUser.id },
            { name: "Safety Panel", panelCode: `SP${machine.productCode.slice(-3)}`, parentMachineId: newMachine.id, addedBy: adminUser.id }
          ];
          
          for (const panel of panelData) {
            await storage.createPanel(panel);
          }
        }
      }

      res.json({ message: "Seed data created successfully" });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
