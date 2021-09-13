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
const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJET2zcxZ1+4AYMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi0zLXUybGItMS51cy5hdXRoMC5jb20wHhcNMjEwOTA2MDcwMjQ1WhcN
MzUwNTE2MDcwMjQ1WjAkMSIwIAYDVQQDExlkZXYtMy11MmxiLTEudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt3TtdSmUUdzqtl1k
nIquQnJVQLOM55Yt5UACvuqD9mZLI5hfQbd7GynwiJ2+iaHW5YE0dhEeuhE3WGFB
A+CoV/M2pNhZslS3ZQhC2AF9VJi89rT2Y9LUpdOdZ9xxUkty1cKihC3gwLQgMnKI
dslsJBgyDrHNNsRK0wAzWymIl7P+N2hfkfZG52IQrHSmuLtTKRS34ETDVeeo7F+o
Ks0RMp9Opwq1xwb8RSqQLNOVNAVs2hincerD1dC9CekneG7sNJxHhYCCuyCFLxvD
xBocTyUS1uYuERVBZdjxQQ/KMONBVWFlGYtOVzlgrTmmKH2+EStqQEOtnsAwEIHb
N/n+JwIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRhpkIbWTvH
Tr79YAkpH5ydtEgJ0jAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
ADHnCz7dRnL+fV/C5sJFPIgKNi/4jBlCdzXwtbhNevwq/i/LXN+NpGh88XHGI3Vw
bnH6Jeiz9SBgI+YbI0tohb8xEcW/e9QQLtKJiMgsrWvcbh648oV8AevUGmw0gIhF
WU8yTZ1GWNXMxzQDASCkn9Plaq9v0UigPL/1pdTUkSMFdREUCF6Ui09E+pU9Z/H7
XE9mYOoV1VUfkzCRY9L9QrWSodpIZ95fsB6o54QKJyWM02YAWBsR1bJbOqkvD4LG
xRKqjdOZZjRY5HHPsnHelcVecun9L5p85U7OZ/18530MdyEkixPVsL6KKaQFkuGK
xjwm5/Hg1gmYXV+NeMNUjJc=
-----END CERTIFICATE-----`;




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
