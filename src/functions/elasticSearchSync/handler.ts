import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk'



const elasticSearchSync:DynamoDBStreamHandler = async (event:DynamoDBStreamEvent) => {
  console.log('Processing events batch from DynamoDB: ', event)
  for (const record of event.Records){
    console.log('Processing record: ', record)
  }

  
}

export const main = middyfy(elasticSearchSync);
