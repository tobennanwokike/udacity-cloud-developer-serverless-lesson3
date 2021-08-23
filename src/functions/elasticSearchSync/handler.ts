import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk'
import * as elasticsearch from 'elasticsearch'
import * as httpAwsEs from 'http-aws-es'

const esHost = process.env.ES_ENDPOINT

const es = new elasticsearch.Client({
  hosts : [ esHost ],
  connectionClass: httpAwsEs
})



const elasticSearchSync:DynamoDBStreamHandler = async (event:DynamoDBStreamEvent) => {
  console.log('Processing events batch from DynamoDB: ', event)
  for (const record of event.Records){
    console.log('Processing record: ', record)

    if(record.eventName !== 'INSERT'){
      continue
    }

    const newItem = record.dynamodb.NewImage
    console.log('Processing newItem: ', newItem)
    const imageId = newItem.imageId.S
    console.log('Processing newImage: ', imageId)

    const body = {
      imageId: newItem.imageId.S,
      groupId: newItem.groupId.S,
      imageUrl: newItem.imageUrl.S,
      title: newItem.title.S,
      timestamp: newItem.timestamp.S,
    }

    await es.index({
      index: 'images-index',
      type: 'images',
      id: imageId,
      body
    })
  }
  
}

export const main = middyfy(elasticSearchSync);
