import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { FunnelResponseSchema } from '@/shared/types';
import { v4 as uuidv4 } from 'uuid';
import { verify } from 'hono/jwt';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const funnel = new Hono<{ Bindings: Bindings }>();

// Middleware to verify JWT for authenticated funnel operations
funnel.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Allow unauthenticated access for initial funnel steps (autosave for anonymous users)
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('jwtPayload', payload);
    await next();
  } catch (e) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

// Save or update funnel responses (autosave)
funnel.post(
  '/save',
  zValidator('json', FunnelResponseSchema.pick({ step_data: true, current_step: true, completed: true, user_id: true }).partial().extend({
    funnel_id: z.string().uuid().optional(), // Allow passing existing funnel ID
  })),
  async (c) => {
    const { step_data, current_step, completed, user_id, funnel_id } = c.req.valid('json');
    const jwtPayload = c.get('jwtPayload');
    const userIdFromJwt = jwtPayload?.userId;

    const actualUserId = userIdFromJwt || user_id || null; // Prioritize JWT, then provided user_id, then null

    try {
      let responseId = funnel_id || uuidv4();
      let existingFunnel;

      if (funnel_id) {
        existingFunnel = await c.env.DB.prepare('SELECT * FROM funnel_responses WHERE id = ?')
          .bind(funnel_id)
          .first<FunnelResponse>();
      } else if (actualUserId) {
        // Try to find an incomplete funnel for the user
        existingFunnel = await c.env.DB.prepare('SELECT * FROM funnel_responses WHERE user_id = ? AND completed = FALSE ORDER BY created_at DESC LIMIT 1')
          .bind(actualUserId)
          .first<FunnelResponse>();
        if (existingFunnel) {
          responseId = existingFunnel.id!;
        }
      }

      if (existingFunnel) {
        // Update existing funnel response
        await c.env.DB.prepare(
          'UPDATE funnel_responses SET step_data = ?, current_step = ?, completed = ?, user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        )
          .bind(
            JSON.stringify({ ...JSON.parse(existingFunnel.step_data), ...step_data }),
            current_step !== undefined ? current_step : existingFunnel.current_step,
            completed !== undefined ? completed : existingFunnel.completed,
            actualUserId,
            responseId
          )
          .run();
      } else {
        // Insert new funnel response
        await c.env.DB.prepare(
          'INSERT INTO funnel_responses (id, user_id, step_data, current_step, completed) VALUES (?, ?, ?, ?, ?)'
        )
          .bind(
            responseId,
            actualUserId,
            JSON.stringify(step_data),
            current_step,
            completed
          )
          .run();
      }

      return c.json({ message: 'Funnel response saved successfully', funnelId: responseId }, 200);
    } catch (error) {
      console.error('Error saving funnel response:', error);
      return c.json({ error: 'Failed to save funnel response' }, 500);
    }
  }
);

// Get latest funnel response for a user (or by funnel_id)
funnel.get('/latest', async (c) => {
  const funnelId = c.req.query('funnel_id');
  const jwtPayload = c.get('jwtPayload');
  const userId = jwtPayload?.userId;

  if (!userId && !funnelId) {
    return c.json({ error: 'User ID or Funnel ID is required' }, 400);
  }

  try {
    let funnelResponse: FunnelResponse | null = null;
    if (funnelId) {
      funnelResponse = await c.env.DB.prepare('SELECT * FROM funnel_responses WHERE id = ?')
        .bind(funnelId)
        .first<FunnelResponse>();
    } else if (userId) {
      funnelResponse = await c.env.DB.prepare('SELECT * FROM funnel_responses WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1')
        .bind(userId)
        .first<FunnelResponse>();
    }

    if (!funnelResponse) {
      return c.json({ message: 'No funnel response found' }, 404);
    }

    return c.json({ ...funnelResponse, step_data: JSON.parse(funnelResponse.step_data as string) }, 200);
  } catch (error) {
    console.error('Error fetching funnel response:', error);
    return c.json({ error: 'Failed to fetch funnel response' }, 500);
  }
});

export default funnel;