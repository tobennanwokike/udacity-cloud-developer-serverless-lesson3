import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient()
const connectionsTable = process.env.CONNECTIONS_TABLE

const getImage = async (event) => {

  const connectionId = event.requestContext.connectionId

  const key = {
    id: connectionId
  }

  await docClient.delete({
    TableName: connectionsTable,
    Key: key
  }).promise()

  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: ''
  }

}

export const main = middyfy(getImage);
