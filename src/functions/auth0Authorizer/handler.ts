import { JwtToken } from './../../auth/JwtToken';
import 'source-map-support/register';
import { middyfy } from '@libs/lambda';
import { CustomAuthorizerEvent, CustomAuthorizerHandler, CustomAuthorizerResult } from 'aws-lambda';

import { verify } from 'jsonwebtoken';
import * as fs from 'fs';
import * as AWS from 'aws-sdk';

const client = new AWS.SecretsManager();

let cachedSecret: string;


const secretId = process.env.AUTH_0_SECRET_ID;
const secretField = process.env.AUTH_0_SECRET_FIELD;

const auth0Authorizer:CustomAuthorizerHandler = async (event:CustomAuthorizerEvent):Promise<CustomAuthorizerResult> => {
  try{
    console.log(event.authorizationToken)
    const decodedToken = await verifyToken(event.authorizationToken)
    
    console.log('User was authorized')

    return {
      principalId: decodedToken.sub,
      policyDocument:{
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource:'*'
          }
        ]
      }
    }
  }
  catch(e){
    console.log('User was not authorized ', e.message)

    return {
      principalId: 'user',
      policyDocument:{
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource:'*'
          }
        ]
      }
    }

  }
  
}

async function verifyToken(authHeader: string) : Promise<JwtToken>{
  if (!authHeader)
    throw new Error('Missing Authorization Header')

  if(!authHeader.toLocaleLowerCase().startsWith('bearer '))
    throw new Error('Invalid Authorization Header Format')

  const split = authHeader.split(' ')
  const token = split[1]

  const secretObject: any = await getSecret()
  let secret = secretObject[secretField]
  //base64decode the secret
  secret = Buffer.from(secret, 'base64');
  console.log(secret)

  

  return verify(token, secret, { algorithms: ['RS256'] }) as JwtToken
}

async function getSecret() {
  if(cachedSecret) return cachedSecret

  const data = await client.getSecretValue({
    SecretId: secretId
  }).promise()

  cachedSecret = data.SecretString

  return JSON.parse(cachedSecret)
}

export const main = middyfy(auth0Authorizer);
