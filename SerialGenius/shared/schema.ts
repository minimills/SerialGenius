import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const countries = pgTable("countries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
});

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  role: text("role").notNull().$type<"Admin" | "Tech">(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const machines = pgTable("machines", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  productCode: text("product_code").notNull().unique(),
  addedBy: integer("added_by").notNull().references(() => users.id),
  addedOn: timestamp("added_on").defaultNow(),
});

export const panels = pgTable("panels", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  panelCode: text("panel_code").notNull().unique(),
  parentMachineId: integer("parent_machine_id").notNull().references(() => machines.id),
  addedBy: integer("added_by").notNull().references(() => users.id),
  addedOn: timestamp("added_on").defaultNow(),
});

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  customerName: text("customer_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  countryId: integer("country_id").notNull().references(() => countries.id),
  quoteNumber: text("quote_number").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  confirmationDate: timestamp("confirmation_date").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  progressStatus: text("progress_status").notNull().$type<"Pending" | "In Progress" | "Completed" | "Confirmed">(),
  paymentStatus: text("payment_status").notNull().$type<"Pending" | "Partial" | "Paid">(),
  machines: jsonb("machines").$type<Array<{ machineId: number; quantity: number }>>().notNull(),
  addedBy: integer("added_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serials = pgTable("serials", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  machineId: integer("machine_id").references(() => machines.id),
  panelId: integer("panel_id").references(() => panels.id),
  serialNumber: text("serial_number").notNull().unique(),
  addedBy: integer("added_by").notNull().references(() => users.id),
  addedOn: timestamp("added_on").defaultNow(),
});

// Relations
export const countriesRelations = relations(countries, ({ many }) => ({
  orders: many(orders),
}));

export const usersRelations = relations(users, ({ many }) => ({
  addedMachines: many(machines),
  addedPanels: many(panels),
  addedOrders: many(orders),
  addedSerials: many(serials),
}));

export const machinesRelations = relations(machines, ({ one, many }) => ({
  addedBy: one(users, { fields: [machines.addedBy], references: [users.id] }),
  panels: many(panels),
  serials: many(serials),
}));

export const panelsRelations = relations(panels, ({ one, many }) => ({
  parentMachine: one(machines, { fields: [panels.parentMachineId], references: [machines.id] }),
  addedBy: one(users, { fields: [panels.addedBy], references: [users.id] }),
  serials: many(serials),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  country: one(countries, { fields: [orders.countryId], references: [countries.id] }),
  addedBy: one(users, { fields: [orders.addedBy], references: [users.id] }),
  serials: many(serials),
}));

export const serialsRelations = relations(serials, ({ one }) => ({
  order: one(orders, { fields: [serials.orderId], references: [orders.id] }),
  machine: one(machines, { fields: [serials.machineId], references: [machines.id] }),
  panel: one(panels, { fields: [serials.panelId], references: [panels.id] }),
  addedBy: one(users, { fields: [serials.addedBy], references: [users.id] }),
}));

// Insert schemas
export const insertCountrySchema = z.object({
  name: z.string(),
  code: z.string(),
});

export const insertUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string(),
  role: z.enum(["Admin", "Tech"]),
});

export const insertMachineSchema = z.object({
  name: z.string(),
  productCode: z.string(),
  addedBy: z.number(),
});

export const insertPanelSchema = z.object({
  name: z.string(),
  panelCode: z.string(),
  parentMachineId: z.number(),
  addedBy: z.number(),
});

export const insertOrderSchema = z.object({
  customerName: z.string(),
  city: z.string(),
  state: z.string(),
  countryId: z.number(),
  quoteNumber: z.string(),
  invoiceNumber: z.string(),
  dueDate: z.date().or(z.string().transform(str => new Date(str))),
  progressStatus: z.enum(["Pending", "In Progress", "Completed", "Confirmed"]),
  paymentStatus: z.enum(["Pending", "Partial", "Paid"]),
  machines: z.array(z.object({
    machineId: z.number(),
    quantity: z.number(),
  })),
  addedBy: z.number(),
});

export const insertSerialSchema = z.object({
  orderId: z.number(),
  machineId: z.number().optional(),
  panelId: z.number().optional(),
  serialNumber: z.string(),
  addedBy: z.number(),
});

// Types
export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type Panel = typeof panels.$inferSelect;
export type InsertPanel = z.infer<typeof insertPanelSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Serial = typeof serials.$inferSelect;
export type InsertSerial = z.infer<typeof insertSerialSchema>;
