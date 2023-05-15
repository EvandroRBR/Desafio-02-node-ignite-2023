import fastify from 'fastify';
import cookie from '@fastify/cookie';
import { usersRoutes } from './routes/users.routes';
import { mealsRoutes } from './routes/meals.routes';
import { metricsRouter } from './routes/metrics.routes';
import { knex } from './database';

export const app = fastify();

app.get('/', async () => {
  const tables = await knex('sqlite_schema').select('*');

  return tables;
});

app.register(cookie);
app.register(usersRoutes, { prefix: 'users' });
app.register(mealsRoutes, { prefix: 'meals' });
app.register(metricsRouter, { prefix: 'metrics' });
