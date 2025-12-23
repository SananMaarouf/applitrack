import { pgTable, serial, text, timestamp, integer, varchar, index, pgView } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  appliedAt: timestamp('applied_at').notNull(),
  expiresAt: timestamp('expires_at'),
  position: text('position').notNull(),
  company: text('company').notNull(),
  status: integer('status').notNull().default(1),
  link: text('link'),
}, (table) => ({
  userIdIdx: index('applications_user_id_idx').on(table.userId),
  createdAtIdx: index('applications_created_at_idx').on(table.createdAt),
}));

export const applicationStatusHistory = pgTable('application_status_history', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  applicationId: integer('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  fromStatus: integer('from_status').notNull(),
  toStatus: integer('to_status').notNull(),
}, (table) => ({
  applicationIdIdx: index('status_history_application_id_idx').on(table.applicationId),
  userIdIdx: index('status_history_user_id_idx').on(table.userId),
}));

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type StatusHistory = typeof applicationStatusHistory.$inferSelect;
export type NewStatusHistory = typeof applicationStatusHistory.$inferInsert;
