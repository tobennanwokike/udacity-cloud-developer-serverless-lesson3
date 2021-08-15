import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE

const getImages = async (event) => {

  const groupId = event.pathParameters.groupId

  const validGroupId = await groupExists(groupId)

  if(!validGroupId){
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: "Group does not exist"
      })
    }
  }

  const images = await getImagesPerGroup(groupId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items: images
    })
  }
}

async function groupExists(groupId: string){
  const result = await docClient.get({
    TableName: groupsTable,
    Key: {
      id: groupId
    }
  }).promise()

  return !!result.Item
}

async function getImagesPerGroup(groupId: string){
  const result = await docClient.query({
    TableName: imagesTable,
    KeyConditionExpression: 'groupId = :groupId',
    ExpressionAttributeValues: {
      ':groupId': groupId
    },
    ScanIndexForward: false
  }).promise()

  return result.Items
}

export const main = middyfy(getImages);
