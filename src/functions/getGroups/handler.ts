import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE

const groups = async (event) => {

  const result = await docClient.scan({
    TableName: groupsTable
  }).promise()

  const items = result.Items

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items
    })
  }
}

export const main = middyfy(groups);
