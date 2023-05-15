// eslint-disable-next-line no-unused-vars
import { knex } from 'knex';

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string;
      session_id: string;
      name: string;
      password: string;
      email: string;
    };
    meals: {
      id: string;
      user_id: string;
      name: string;
      description: string;
      date: Date;
      in_diet: boolean;
    };
  }
}
