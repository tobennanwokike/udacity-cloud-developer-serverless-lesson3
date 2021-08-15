import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient()
const imageIdIndex = process.env.IMAGE_ID_INDEX
const imagesTable = process.env.IMAGES_TABLE

const getImage = async (event) => {

  const imageId = event.pathParameters.imageId

  const result = await docClient.query({
    TableName: imagesTable,
    IndexName: imageIdIndex,
    KeyConditionExpression: 'imageId = :imageId',
    ExpressionAttributeValues: {
      ':imageId': imageId
    },
    ScanIndexForward: false
  }).promise()

  if(result.Count !== 0){
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Items[0])
    }
  }

  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: "Image does not exist"
    })
  }

}

export const main = middyfy(getImage);
