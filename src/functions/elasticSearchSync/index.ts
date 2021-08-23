import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    ES_ENDPOINT: { 'Fn::GetAtt': ['ImagesSearch', 'DomainEndpoint'] }
  },
  events: [
    {
      stream: {
        type: 'dynamodb',
        arn: { 'Fn::GetAtt': ['ImagesDynamoDBTable', 'StreamArn'] }
      }
    }
  ]
}
