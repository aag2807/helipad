import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Bookings table
export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  purpose: text("purpose").notNull(),
  notes: text("notes"),
  contactPhone: text("contact_phone"),
  passengers: integer("passengers").notNull().default(1),
  status: text("status", { enum: ["pending", "confirmed", "cancelled"] }).notNull().default("confirmed"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
  cancelledBy: text("cancelled_by").references(() => users.id),
});

// Settings table (key-value store)
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  value: text("value").notNull(), // JSON string
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Email configurations table
export const emailConfigurations = sqliteTable("email_configurations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  provider: text("provider", { enum: ["smtp", "resend"] }).notNull().default("smtp"),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpSecure: integer("smtp_secure", { mode: "boolean" }).default(true),
  smtpUser: text("smtp_user"),
  smtpPassword: text("smtp_password"),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull(),
  resendApiKey: text("resend_api_key"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Email logs table
export const emailLogs = sqliteTable("email_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  bookingId: text("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  type: text("type", { enum: ["confirmation", "cancellation", "reminder", "password_reset"] }).notNull(),
  status: text("status", { enum: ["sent", "failed"] }).notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  error: text("error"),
});

// Password reset tokens table
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  emailLogs: many(emailLogs),
  passwordResetTokens: many(passwordResetTokens),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  cancelledByUser: one(users, {
    fields: [bookings.cancelledBy],
    references: [users.id],
  }),
  emailLogs: many(emailLogs),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(users, {
    fields: [emailLogs.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [emailLogs.bookingId],
    references: [bookings.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type EmailConfiguration = typeof emailConfigurations.$inferSelect;
export type NewEmailConfiguration = typeof emailConfigurations.$inferInsert;
export type EmailLog = typeof emailLogs.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

