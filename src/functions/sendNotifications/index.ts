import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    STAGE: '${self:provider.stage}',
    API_ID: { Ref: 'WebsocketsApi' }
  },
  events: [
    {
      s3: {
        bucket: 'serverless-udagram-images-tobenna-dev',
        event: 's3:ObjectCreated:*',
        existing: true
      }
    }
  ]
}
