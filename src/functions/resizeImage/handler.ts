import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { SNSHandler, S3Event, SNSEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk'

import * as Jimp from 'jimp'




const imagesBucket = process.env.IMAGES_S3_BUCKET
const thumbnailsBucket = process.env.THUMBNAILS_S3_BUCKET


const s3 = new AWS.S3()

const resizeImage: SNSHandler = async (event: SNSEvent) => {
  console.log('Processing SNS event: ', event)
  for (const snsRecord of event.Records){
    const s3EventStr = snsRecord.Sns.Message
    console.log('Processing item with key: ', s3EventStr)
    const s3Event = JSON.parse(s3EventStr)
    
    await processImage(s3Event)
    
  }
}

async function processImage(S3Event:S3Event){
  for (const record of S3Event.Records){
    const key = record.s3.object.key
    console.log('Processing item with key: ', key)

    const response = await s3.getObject({
      Bucket: imagesBucket,
      Key: key
    })
    .promise()


    const body = response.Body!
    console.log(response.Body)
    // const bodyBuff = Buffer.from(body);
    // console.log(bodyBuff)

    // let content_buffer: Buffer | null = null;

    // content_buffer = await getStream.buffer(body as any);
    


    // Read an image with the Jimp library
    const image = await Jimp.read(body as any)

    // Resize an image maintaining the ratio between the image's width and height
    image.resize(150, Jimp.AUTO)

    // Convert an image to a buffer that we can write to a different bucket
    const convertedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG)

    await s3
    .putObject({
      Bucket: thumbnailsBucket,
      Key: `${key}.jpeg`,
      Body: convertedBuffer
    })
    .promise()

  }

  
}



export const main = middyfy(resizeImage);
