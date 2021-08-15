import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE

const createGroup = async (event) => {

  const itemId = uuid.v4()

  const parsedBody = event.body

  const newItem = {
    id: itemId,
    ...parsedBody
  }

  await docClient.put({
    TableName: groupsTable,
    Item: newItem
  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newItem
    })
  }
}

export const main = middyfy(createGroup);
