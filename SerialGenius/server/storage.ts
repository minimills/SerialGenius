import { 
  countries, users, machines, panels, orders, serials,
  type Country, type InsertCountry,
  type User, type InsertUser,
  type Machine, type InsertMachine,
  type Panel, type InsertPanel,
  type Order, type InsertOrder,
  type Serial, type InsertSerial
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Countries
  getCountries(): Promise<Country[]>;
  
  // Machines
  getMachines(): Promise<Machine[]>;
  getMachine(id: number): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  updateMachine(id: number, machine: Partial<InsertMachine>): Promise<Machine>;
  deleteMachine(id: number): Promise<void>;
  
  // Panels
  getPanels(): Promise<Panel[]>;
  getPanelsByMachine(machineId: number): Promise<Panel[]>;
  getPanel(id: number): Promise<Panel | undefined>;
  createPanel(panel: InsertPanel): Promise<Panel>;
  updatePanel(id: number, panel: Partial<InsertPanel>): Promise<Panel>;
  deletePanel(id: number): Promise<void>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: number): Promise<void>;
  
  // Serials
  getSerials(): Promise<Serial[]>;
  getSerialsByOrder(orderId: number): Promise<Serial[]>;
  getLastSerialByPrefix(prefix: string): Promise<Serial | undefined>;
  createSerial(serial: InsertSerial): Promise<Serial>;
  createMultipleSerials(serials: InsertSerial[]): Promise<Serial[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  // Countries
  async getCountries(): Promise<Country[]> {
    return await db.select().from(countries);
  }

  // Machines
  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines).orderBy(desc(machines.addedOn));
  }

  async getMachine(id: number): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.id, id));
    return machine || undefined;
  }

  async createMachine(machine: InsertMachine): Promise<Machine> {
    const [newMachine] = await db.insert(machines).values(machine).returning();
    return newMachine;
  }

  async updateMachine(id: number, machine: Partial<InsertMachine>): Promise<Machine> {
    const [updatedMachine] = await db
      .update(machines)
      .set(machine)
      .where(eq(machines.id, id))
      .returning();
    return updatedMachine;
  }

  async deleteMachine(id: number): Promise<void> {
    await db.delete(machines).where(eq(machines.id, id));
  }

  // Panels
  async getPanels(): Promise<Panel[]> {
    return await db.select().from(panels).orderBy(desc(panels.addedOn));
  }

  async getPanelsByMachine(machineId: number): Promise<Panel[]> {
    return await db.select().from(panels).where(eq(panels.parentMachineId, machineId));
  }

  async getPanel(id: number): Promise<Panel | undefined> {
    const [panel] = await db.select().from(panels).where(eq(panels.id, id));
    return panel || undefined;
  }

  async createPanel(panel: InsertPanel): Promise<Panel> {
    const [newPanel] = await db.insert(panels).values(panel).returning();
    return newPanel;
  }

  async updatePanel(id: number, panel: Partial<InsertPanel>): Promise<Panel> {
    const [updatedPanel] = await db
      .update(panels)
      .set(panel)
      .where(eq(panels.id, id))
      .returning();
    return updatedPanel;
  }

  async deletePanel(id: number): Promise<void> {
    await db.delete(panels).where(eq(panels.id, id));
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set(order)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  // Serials
  async getSerials(): Promise<Serial[]> {
    return await db.select().from(serials).orderBy(desc(serials.addedOn));
  }

  async getSerialsByOrder(orderId: number): Promise<Serial[]> {
    return await db.select().from(serials).where(eq(serials.orderId, orderId));
  }

  async getLastSerialByPrefix(prefix: string): Promise<Serial | undefined> {
    const [serial] = await db
      .select()
      .from(serials)
      .where(eq(serials.serialNumber, prefix))
      .orderBy(desc(serials.serialNumber))
      .limit(1);
    return serial || undefined;
  }

  async createSerial(serial: InsertSerial): Promise<Serial> {
    const [newSerial] = await db.insert(serials).values(serial).returning();
    return newSerial;
  }

  async createMultipleSerials(serialsData: InsertSerial[]): Promise<Serial[]> {
    return await db.insert(serials).values(serialsData).returning();
  }
}

export const storage = new DatabaseStorage();
