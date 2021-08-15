import type { AWS } from '@serverless/typescript';

import hello from '@functions/hello';
import groups from '@functions/getGroups';
import createGroup from '@functions/createGroup';
import getImages from '@functions/getImages';
import getImage from '@functions/getImage';
import createImage from '@functions/createImage';

const serverlessConfiguration: AWS = {
  service: 'service-10-udagram-app',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
  },
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    stage: 'dev',
    region: 'us-east-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      GROUPS_TABLE: 'Groups-${self:provider.stage}',
      IMAGES_TABLE: 'Image-${self:provider.stage}',
      IMAGE_ID_INDEX: 'ImageIdIndex'
    },
    lambdaHashingVersion: '20201221',
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:Scan',
          'dynamodb:PutItem',
          'dynamodb:GetItem'
        ],
        Resource: [
          {"Fn::GetAtt": [ 'GroupsDynamoDBTable', 'Arn' ]}
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:Query',
          'dynamodb:PutItem'
        ],
        Resource: [
          {"Fn::GetAtt": [ 'ImagesDynamoDBTable', 'Arn' ]}
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:Query'
        ],
        Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}'
      }
    ]
  },
  // import the function via paths
  functions: { hello, groups, createGroup, getImages, getImage, createImage },
  resources:{
    Resources: {
      GroupsDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            TableName: '${self:provider.environment.GROUPS_TABLE}',
            AttributeDefinitions: [
                { AttributeName: 'id', AttributeType: 'S' }
            ],
            KeySchema: [
                { AttributeName: 'id', KeyType: 'HASH' }
            ],
            BillingMode: 'PAY_PER_REQUEST'
        }
      },
      ImagesDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.IMAGES_TABLE}',
          AttributeDefinitions: [
              { AttributeName: 'groupId', AttributeType: 'S' },
              { AttributeName: 'timestamp', AttributeType: 'S' },
              { AttributeName: 'imageId', AttributeType: 'S' }
          ],
          KeySchema: [
              { AttributeName: 'groupId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: '${self:provider.environment.IMAGE_ID_INDEX}',
              KeySchema: [
                  { AttributeName: 'imageId', KeyType: 'HASH' },
              ],
              Projection: {
                  ProjectionType: 'ALL' 
              }
            }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
