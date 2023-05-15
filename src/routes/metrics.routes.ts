import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { HttpError } from '../errors/HttpError';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';

export async function metricsRouter(app: FastifyInstance) {
  app.get(
    '/count',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const loggedUser = await knex('users')
        .where({ session_id: sessionId })
        .first();

      if (!loggedUser) {
        throw new HttpError('You have to login', 401);
      }

      const countMeals = await knex('meals')
        .where({
          user_id: loggedUser.id,
        })
        .count('* as mealsQuantity')
        .as('teste')
        .first();

      return reply.status(200).send(countMeals);
    },
  );

  app.get(
    '/count/by-diet',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const countMealsByDietQuerySchema = z.object({
        inDiet: z.literal('true').or(z.literal('false')),
      });

      const parsedQuery = countMealsByDietQuerySchema.parse(request.query);
      const inDiet: boolean = parsedQuery.inDiet === 'true';

      const { sessionId } = request.cookies;

      const loggedUser = await knex('users')
        .where({ session_id: sessionId })
        .first();

      if (!loggedUser) {
        throw new HttpError('You have to login', 401);
      }

      const countMeals = await knex('meals')
        .where({
          user_id: loggedUser.id,
          in_diet: inDiet,
        })
        .count('* as mealsQuantity')
        .first();

      return reply.status(200).send({ countMeals, inDiet });
    },
  );

  app.get(
    '/count/best-sequency',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const loggedUser = await knex('users')
        .where({ session_id: sessionId })
        .first();

      if (!loggedUser) {
        throw new HttpError('You have to login', 401);
      }

      const meals = await knex('meals')
        .select('in_diet', 'date')
        .where({
          user_id: loggedUser.id,
        })
        .orderBy('date');

      const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000;

      let count = 0;
      let bestSequency = 0;

      for (let i = 1; i < meals.length; i++) {
        const diffInMilliseconds = Math.abs(
          Number(meals[i - 1].date) - Number(meals[i].date),
        );

        if (
          diffInMilliseconds <= twentyFourHoursInMilliseconds &&
          meals[i].in_diet
        ) {
          count++;
          bestSequency = bestSequency > count ? bestSequency : count;
        } else {
          count = 0;
        }
      }

      return reply.status(200).send({ bestSequency });
    },
  );
}
