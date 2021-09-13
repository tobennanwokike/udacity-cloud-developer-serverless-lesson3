import { handlerPath } from '@libs/handlerResolver';
import schema from './schema';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'groups',
        cors: true,
        authorizer: {name: 'auth0Authorizer'},
        request: {
          schema: {
            'application/json': schema
          }
        }
      }
    }
  ]
}
