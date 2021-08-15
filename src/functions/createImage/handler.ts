import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid';

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

  const imageId = uuid.v4()
  const newItem = await createImage(groupId, imageId, event)

  // const parsedBody = event.body

  // const newItem = {
  //   groupId: groupId,
  //   imageId: imageId,
  //   ...parsedBody
  // }

  // await docClient.put({
  //   TableName: imagesTable,
  //   Item: newItem
  // }).promise()

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

async function groupExists(groupId: string){
  const result = await docClient.get({
    TableName: groupsTable,
    Key: {
      id: groupId
    }
  }).promise()

  return !!result.Item
}

async function createImage(groupId: string, imageId: string, event: any) {
  const timestamp = new Date().toISOString()
  const newImage = event.body

  const newItem = {
    groupId,
    timestamp,
    imageId,
    ...newImage,
  }
  console.log('Storing new item: ', newItem)

  await docClient
    .put({
      TableName: imagesTable,
      Item: newItem
    })
    .promise()

  return newItem
}

export const main = middyfy(getImages);
