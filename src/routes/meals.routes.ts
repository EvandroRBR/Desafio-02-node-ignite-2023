import { FastifyInstance } from 'fastify';
import { knex } from '../database';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';
import { HttpError } from '../errors/HttpError';
// ROTA VALIDADA

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const meals = await knex('meals').select();

      return meals;
    },
  );

  app.get(
    '/:mealId',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        mealId: z.string().uuid(),
      });

      const { mealId } = getMealParamsSchema.parse(request.params);

      const loggedUser = await knex('users')
        .where({
          session_id: request.cookies.sessionId,
        })
        .first();

      if (!loggedUser) {
        throw new HttpError('You have to login', 401);
      }

      const meal = await knex('meals').where({ id: mealId }).first();

      if (!meal) {
        throw new HttpError('Meal not found', 404);
      }

      if (meal.user_id !== loggedUser.id) {
        throw new HttpError('You can not access another user meals', 403);
      }

      return reply.status(200).send({ meal });
    },
  );

  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string().nonempty(),
        description: z.string().nonempty(),
        date: z.string().transform((value) => new Date(value)),
        inDiet: z.boolean(),
      });
      const { name, description, date, inDiet } = createMealBodySchema.parse(
        request.body,
      );

      const user = await knex('users')
        .where({
          session_id: request.cookies.sessionId,
        })
        .first();

      if (!user) {
        throw new HttpError('User not found', 404);
      }

      await knex('meals').insert({
        id: randomUUID(),
        user_id: user.id,
        name,
        description,
        date,
        in_diet: inDiet,
      });

      return reply.status(204).send();
    },
  );

  app.put(
    '/:mealId',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const updateMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        date: z
          .string()
          .transform((value) => new Date(value))
          .optional(),
        inDiet: z.boolean().optional(),
      });
      const updateMealParamsSchema = z.object({
        mealId: z.string().uuid(),
      });

      const { name, description, date, inDiet } = updateMealBodySchema.parse(
        request.body,
      );

      const { mealId } = updateMealParamsSchema.parse(request.params);

      const loggedUser = await knex('users')
        .where({
          session_id: request.cookies.sessionId,
        })
        .first();

      if (!loggedUser) {
        throw new HttpError('You have to login', 401);
      }

      const meal = await knex('meals').where({ id: mealId }).first();

      if (!meal) {
        throw new HttpError('Meal not found', 404);
      }

      if (meal.user_id !== loggedUser.id) {
        throw new HttpError('You can not update another user meal', 403);
      }

      const updatedFields = {
        ...meal,
        name,
        description,
        date,
        in_diet: inDiet,
        updated_at: new Date(),
      };

      await knex('meals').where({ id: meal.id }).update(updatedFields);

      return reply.status(204).send();
    },
  );

  app.delete(
    '/:mealId',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        mealId: z.string().uuid(),
      });

      const { mealId } = getMealParamsSchema.parse(request.params);

      const loggedUser = await knex('users')
        .where({
          session_id: request.cookies.sessionId,
        })
        .first();

      if (!loggedUser) {
        throw new HttpError('You have to login', 401);
      }

      const meal = await knex('meals').where({ id: mealId }).first();

      if (!meal) {
        throw new HttpError('Meal not found', 404);
      }

      if (meal.user_id !== loggedUser.id) {
        throw new HttpError('You can not delete another user meals', 403);
      }

      await knex('meals')
        .where({ id: mealId })
        .del()
        .then(() => {
          reply.status(204).send();
        })
        .catch(() => {
          reply.status(500).send('Error to delete meal');
        });
    },
  );

  // métricas
  app.get(
    '/user',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const loggedUser = await knex('users')
        .where({ session_id: sessionId })
        .first();

      if (!loggedUser) {
        throw new HttpError('You have to login', 401);
      }

      const userMeals = await knex('meals').where({
        user_id: loggedUser.id,
      });

      return reply.status(200).send({ userMeals });
    },
  );
}
