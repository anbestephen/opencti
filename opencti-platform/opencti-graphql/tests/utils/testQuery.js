import { ApolloServer } from 'apollo-server-express';
import { createTestClient } from 'apollo-server-testing';
import createSchema from '../../src/graphql/schema';
import conf from '../../src/config/conf';
import { redisInitializeClients } from '../../src/database/redis';
import { BYPASS, ROLE_ADMINISTRATOR } from '../../src/utils/access';

export const PYTHON_PATH = './src/python';
export const API_URI = `http://localhost:${conf.get('app:port')}`;
export const API_TOKEN = conf.get('app:admin:token');
export const ONE_MINUTE = 60 * 1000;
export const FIVE_MINUTES = 5 * ONE_MINUTE;

beforeAll(async () => {
  await redisInitializeClients();
});

export const ADMIN_USER = {
  id: '88ec0c6a-13ce-5e39-b486-354fe4a7084f',
  name: 'admin',
  user_email: 'admin@opencti.io',
  roles: [{ name: ROLE_ADMINISTRATOR }],
  capabilities: [{ name: BYPASS }],
  allowed_marking: [],
  origin: { source: 'test', user_id: '88ec0c6a-13ce-5e39-b486-354fe4a7084f' },
};

export const serverFromUser = (user = ADMIN_USER) => {
  return new ApolloServer({
    schema: createSchema(),
    context: () => ({ user }),
  });
};

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
export const queryAsAdmin = createTestClient(serverFromUser()).query;
export const queryAsUser = (user) => createTestClient(serverFromUser(user)).query;
