import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Active execution pipeline items
export const pipelineItems = pgTable('pipeline_items', {
  id: text('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  title: text('title').notNull(),
  sectorId: text('sector_id').notNull(),
  sectorName: text('sector_name').notNull(),
  stage: text('stage').notNull(),
  targetMrr: doublePrecision('target_mrr').notNull().default(0),
  currentMrr: doublePrecision('current_mrr').notNull().default(0),
  notes: text('notes').notNull().default(''),
  addedAt: text('added_at').notNull(),
  checklists: jsonb('checklists').$type<{ text: string; done: boolean }[]>().notNull().default([]),
  countryCode: text('country_code'),
  currency: text('currency'),
  paymentMethod: text('payment_method'),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Synthesized strict opportunities
export const opportunities = pgTable('opportunities', {
  id: text('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  countryCode: text('country_code').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  sourceSignals: jsonb('source_signals').$type<unknown[]>().notNull().default([]),
  whyItExists: text('why_it_exists').notNull(),
  confidenceLevel: text('confidence_level').notNull(),
  risks: jsonb('risks').$type<string[]>().notNull().default([]),
  invalidationTriggers: jsonb('invalidation_triggers').$type<string[]>().notNull().default([]),
  targetRevenueLocal: text('target_revenue_local').notNull(),
  estimatedMargin: text('estimated_margin').notNull(),
  hasEnoughData: boolean('has_enough_data').notNull().default(true),
  insufficientDataReason: text('insufficient_data_reason'),
  createdAt: text('created_at').notNull(),
});

// Launch kits (digital & physical) keyed by opportunityId + userUid
export const launchKits = pgTable('launch_kits', {
  id: text('id').primaryKey(), // `${userUid}:${oppId}`
  oppId: text('opp_id').notNull(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  digital: jsonb('digital').$type<Record<string, unknown> | null>(),
  physical: jsonb('physical').$type<Record<string, unknown> | null>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Saved execution blueprints
export const savedBlueprints = pgTable('saved_blueprints', {
  id: text('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  sectorId: text('sector_id').notNull(),
  sectorName: text('sector_name').notNull(),
  niche: text('niche').notNull(),
  targetRevenue: text('target_revenue').notNull(),
  capitalBudget: text('capital_budget').notNull(),
  userSkills: text('user_skills').notNull(),
  businessModel: text('business_model').notNull(),
  blueprint: jsonb('blueprint').$type<Record<string, unknown>>().notNull(),
  createdAt: text('created_at').notNull(),
});

// Saved cross-sector arbitrages
export const savedArbitrages = pgTable('saved_arbitrages', {
  id: text('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  sectorA: text('sector_a').notNull(),
  sectorB: text('sector_b').notNull(),
  riskTolerance: text('risk_tolerance').notNull(),
  analysis: jsonb('analysis').$type<Record<string, unknown>>().notNull(),
  createdAt: text('created_at').notNull(),
});

// Saved launchpad circuits
export const savedLaunchpads = pgTable('saved_launchpads', {
  id: text('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  sectorId: text('sector_id').notNull(),
  sectorName: text('sector_name').notNull(),
  opportunityTitle: text('opportunity_title').notNull(),
  circuit: jsonb('circuit').$type<Record<string, unknown>>().notNull(),
  createdAt: text('created_at').notNull(),
});

// Validation queue with real delivery tracking
export const validationQueue = pgTable('validation_queue', {
  id: text('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  targetRecipient: text('target_recipient'),
  contentPayload: text('content_payload').notNull(),
  sourceOpportunityTitle: text('source_opportunity_title').notNull(),
  countryCode: text('country_code').notNull(),
  status: text('status').notNull().default('en_attente'),
  createdAt: text('created_at').notNull(),
  reviewedAt: text('reviewed_at'),
  reviewNotes: text('review_notes'),
  deliveryChannel: text('delivery_channel'),
  deliveryStatus: text('delivery_status'),
  deliveryTarget: text('delivery_target'),
  deliverySubject: text('delivery_subject'),
  deliveryProvider: text('delivery_provider'),
  deliveryMessageId: text('delivery_message_id'),
  deliveryError: text('delivery_error'),
  deliveredAt: text('delivered_at'),
});

// Immutable audit trail
export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  timestamp: text('timestamp').notNull(),
  actionType: text('action_type').notNull(),
  actor: text('actor').notNull(),
  description: text('description').notNull(),
  provenanceDetails: text('provenance_details'),
  status: text('status').notNull(),
});

// Real recorded sales
export const realSales = pgTable('real_sales', {
  id: text('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  clientName: text('client_name').notNull(),
  opportunityId: text('opportunity_id'),
  opportunityTitle: text('opportunity_title').notNull(),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').notNull(),
  date: text('date').notNull(),
  status: text('status').notNull(),
  paymentMethod: text('payment_method').notNull(),
  notes: text('notes'),
  reference: text('reference'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Persisted company & payment billing profile per user
export const companyProfiles = pgTable('company_profiles', {
  userUid: text('user_uid')
    .primaryKey()
    .references(() => users.uid),
  companyName: text('company_name').notNull().default(''),
  nif: text('nif').notNull().default(''),
  phone: text('phone').notNull().default(''),
  iban: text('iban').notNull().default(''),
  selectedBank: text('selected_bank').notNull().default(''),
  selectedMobileOperator: text('selected_mobile_operator').notNull().default(''),
  selectedAgency: text('selected_agency').notNull().default(''),
  customPaymentLink: text('custom_payment_link').notNull().default(''),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Key-value state table for shared/global operational snapshots (signals, source_health, fx_rates, usage_stats)
export const appState = pgTable('app_state', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  pipelineItems: many(pipelineItems),
  opportunities: many(opportunities),
  launchKits: many(launchKits),
  savedBlueprints: many(savedBlueprints),
  savedArbitrages: many(savedArbitrages),
  savedLaunchpads: many(savedLaunchpads),
  validationQueue: many(validationQueue),
  auditLog: many(auditLog),
  realSales: many(realSales),
  companyProfiles: many(companyProfiles),
}));
