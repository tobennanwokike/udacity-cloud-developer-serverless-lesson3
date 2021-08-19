import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { S3Handler, S3Event } from 'aws-lambda';
import * as AWS from 'aws-sdk'


const sendNotifications:S3Handler = async (event:S3Event) => {
  console.log('We out here')
  for (const record of event.Records){
    const key = record.s3.object.key
    console.log('Processing item with key: ', key)
  }
}

export const main = middyfy(sendNotifications);
