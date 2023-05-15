import { randomUUID } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { HttpError } from '../errors/HttpError';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';

export async function usersRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const users = await knex('users').select();

      return reply.status(200).send({ users });
    },
  );

  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string().nonempty(),
      password: z.string().nonempty().min(6),
      email: z.string().email().nonempty(),
    });

    const { name, password, email } = createUserBodySchema.parse(request.body);

    const userExists = await knex('users').where({ email }).first();

    if (userExists) {
      const error = new HttpError('Email already in use', 409);
      throw error;
    }

    const sessionId = randomUUID();

    await knex('users').insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
      password,
      email,
    });

    reply.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7days
    });

    return reply.status(201).send({ message: 'Success' });
  });

  app.post('/sessions', async (request, reply) => {
    const authenticateUserBodySchema = z.object({
      email: z.string().email().nonempty(),
      password: z.string().nonempty(),
    });

    const { email, password } = authenticateUserBodySchema.parse(request.body);

    const user = await knex('users').where({ email }).first();

    if (!user) {
      const error = new HttpError('User not found', 404);
      throw error;
    }

    if (user.password !== password) {
      const error = new HttpError('Incorrect email/password combination.', 401);
      throw error;
    }

    const sessionId = randomUUID();

    await knex('users')
      .where({ id: user.id })
      .update({ session_id: sessionId });

    reply.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7days
    });

    return reply.status(201).send({ message: 'Success' });
  });
}
