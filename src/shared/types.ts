import z from "zod";

/**
 * Types shared between the client and server go here.
 *
 * For example, we can add zod schemas for API input validation, and derive types from them:
 *
 * export const TodoSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   completed: z.number().int(), // 0 or 1
 * })
 *
 * export type TodoType = z.infer<typeof TodoSchema>;
 */

export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  password: z.string().min(8).optional(), // Only for input, not stored
  password_hash: z.string().optional(), // Stored hash
  name: z.string().optional(),
  role: z.enum(['client', 'admin']).default('client'), // Adicionado o campo role
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const FunnelResponseSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().nullable().optional(),
  step_data: z.record(z.any()), // Object to store all step data
  current_step: z.number().int().default(0),
  completed: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type FunnelResponse = z.infer<typeof FunnelResponseSchema>;

export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  funnel_response_id: z.string().uuid(),
  plan_name: z.string(),
  status: z.string().default('briefing_received'),
  summary: z.string().nullable().optional(),
  estimated_delivery: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const SubscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  stripe_subscription_id: z.string().nullable().optional(), // Pode ser null inicialmente
  stripe_price_id: z.string(), // Alterado para stripe_price_id, não nullable
  plan_name: z.string(),
  amount: z.number(),
  status: z.string().default('pending'),
  next_due_date: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

export const InternalDocumentSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  document_type: z.string(),
  version: z.number().int().default(1),
  content: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type InternalDocument = z.infer<typeof InternalDocumentSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string().default('to_do'),
  assigned_to: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Task = z.infer<typeof TaskSchema>;