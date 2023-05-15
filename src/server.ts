import { app } from './app';
import { env } from './env';

app.listen({ port: env.PORT }).then(() => {
  console.log('\x1b[32m SERVER IS RUNNING! \x1b[0m');
});
