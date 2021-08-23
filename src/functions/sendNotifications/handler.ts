import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { SNSHandler, S3Event, SNSEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk'


const docClient = new AWS.DynamoDB.DocumentClient()
const connectionsTable = process.env.CONNECTIONS_TABLE
const stage = process.env.STAGE
const apiId = process.env.API_ID

const connectionParams = {
  apiVersion: '2018-11-29',
  endpoint: `${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`
}

const apiGateway = new AWS.ApiGatewayManagementApi(connectionParams)

const sendNotifications: SNSHandler = async (event: SNSEvent) => {
  console.log('Processing SNS event: ', event)
  for (const snsRecord of event.Records){
    const s3EventStr = snsRecord.Sns.Message
    console.log('Processing item with key: ', s3EventStr)
    const s3Event = JSON.parse(s3EventStr)
    
    await processS3event(s3Event)
    
  }
}

async function processS3event(S3Event:S3Event){
  for (const record of S3Event.Records){
    const key = record.s3.object.key
    console.log('Processing item with key: ', key)

    const connections = await docClient.scan({
      TableName: connectionsTable
    }).promise()
  
    const payload = {
      imageId: key
    }

    for(const connection of connections.Items){
      const connectionId = connection.id
      await sendMessageToClient(connectionId, payload)
    }
  }

  
}

async function sendMessageToClient(connectionId, payload) {
  try {
    console.log('Sending message to a connection', connectionId)

    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(payload)
    }).promise()
  } catch (error) {
    console.log('Failed to send message', JSON.stringify(error))

    if(error.statusCode === 410){
      console.log('Stale Connection')

      await docClient.delete({
        TableName: connectionsTable,
        Key: {
          id: connectionId
        }
      }).promise()
    }
  }
  
}

export const main = middyfy(sendNotifications);
