import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { S3Handler, S3Event } from 'aws-lambda';
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

const sendNotifications:S3Handler = async (event:S3Event) => {
  console.log('We out here')
  for (const record of event.Records){
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
