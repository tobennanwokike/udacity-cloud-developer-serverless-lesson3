import auth0Authorizer from '@functions/auth0Authorizer';
import type { AWS } from '@serverless/typescript';

import hello from '@functions/hello';
import groups from '@functions/getGroups';
import createGroup from '@functions/createGroup';
import getImages from '@functions/getImages';
import getImage from '@functions/getImage';
import createImage from '@functions/createImage';
import sendNotifications from '@functions/sendNotifications';
import connect from '@functions/connect';
import disconnect from '@functions/disconnect';
import resizeImage from '@functions/resizeImage';
import elasticSearchSync from '@functions/elasticSearchSync';

const serverlessConfiguration: AWS = {
  service: 'service-10-udagram-app',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
    topicName: 'imagesTopic-${self:provider.stage}'
  },
  plugins: ['serverless-webpack'],
  package:{
    individually: false,
    include: ['src/**']
  },
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
      CONNECTIONS_TABLE: 'Connections-${self:provider.stage}',
      IMAGE_ID_INDEX: 'ImageIdIndex',
      IMAGES_S3_BUCKET: 'serverless-udagram-images-tobenna-${self:provider.stage}',
      SIGNED_URL_EXPIRATION: '300',
      THUMBNAILS_S3_BUCKET: 'serverless-udagram-images-tobenna-thumbnails-${self:provider.stage}',
      AUTH_0_SECRET_ID: 'Auth0Secret-${self:provider.stage}',
      AUTH_0_SECRET_FIELD: 'auth0Secret'
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
          'dynamodb:Scan',
          'dynamodb:PutItem',
          'dynamodb:DeleteItem'
        ],
        Resource: [
          {"Fn::GetAtt": [ 'ConnectionsDynamoDBTable', 'Arn' ]}
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
      },
      {
        Effect: 'Allow',
        Action: [
          's3:PutObject',
          's3:GetObject'
        ],
        Resource: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*'
      },
      {
        Effect: 'Allow',
        Action: [
          's3:PutObject'
        ],
        Resource: 'arn:aws:s3:::${self:provider.environment.THUMBNAILS_S3_BUCKET}/*'
      },
      {
        Effect: 'Allow',
        Action: [
          'secretsmanager:GetSecretValue'
        ],
        Resource: { Ref: 'Auth0Secret' }
      },
      {
        Effect: 'Allow',
        Action: [
          'kms:Decrypt'
        ],
        Resource: [
          {"Fn::GetAtt": [ 'KMSKey', 'Arn' ]}
        ]
      }
    ]
  },
  // import the function via paths
  functions: { hello, groups, createGroup, getImages, getImage, createImage, sendNotifications, connect, disconnect, elasticSearchSync, resizeImage, auth0Authorizer },
  resources:{
    Resources: {
      GatewayResponseDefault4xx: {
        Type: 'AWS::ApiGateway::GatewayResponse',
        Properties: {
            ResponseParameters: {
              "gatewayresponse.header.Access-Control-Allow-Origin":"'*'",
              "gatewayresponse.header.Access-Control-Allow-Headers":"'*'",
              "gatewayresponse.header.Access-Control-Allow-Methods":"'GET,OPTIONS,POST'"
            },
            ResponseType: "DEFAULT_4XX",
            RestApiId: {
              Ref: 'ApiGatewayRestApi'
            }
        }
      },
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
      ConnectionsDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            TableName: '${self:provider.environment.CONNECTIONS_TABLE}',
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
          BillingMode: 'PAY_PER_REQUEST',
          StreamSpecification: {
            StreamViewType: 'NEW_IMAGE'
          }
        }
      },
      AttachmentsBucket: {
        Type: 'AWS::S3::Bucket',
        DependsOn: ['SNSTopicPolicy'],
        Properties: {
          BucketName: '${self:provider.environment.IMAGES_S3_BUCKET}',
          NotificationConfiguration: {
            TopicConfigurations:[{
              Event: 's3:ObjectCreated:*',
              Topic: { Ref: 'ImagesTopic' }
            }]
          },
          CorsConfiguration:{
            CorsRules: [
              {
                  AllowedOrigins: ['*'],
                  AllowedHeaders: ['*'],
                  AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                  MaxAge: 3000,
              },
            ],
          }
        }
      },
      ThumbnailsBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.THUMBNAILS_S3_BUCKET}',
          CorsConfiguration:{
            CorsRules: [
              {
                  AllowedOrigins: ['*'],
                  AllowedHeaders: ['*'],
                  AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                  MaxAge: 3000,
              },
            ],
          }
        }
      },
      BucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          PolicyDocument:{
            Id: 'MyPolicy',
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadForGetBucketObjects',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*'
              }
            ]
          },
          Bucket: '${self:provider.environment.IMAGES_S3_BUCKET}'
        }
      },
      ThumbnailsBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          PolicyDocument:{
            Id: 'ThumbnailsPolicy',
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadForGetBucketObjects',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: 'arn:aws:s3:::${self:provider.environment.THUMBNAILS_S3_BUCKET}/*'
              }
            ]
          },
          Bucket: '${self:provider.environment.THUMBNAILS_S3_BUCKET}'
        }
      },
      ImagesSearch: {
        Type: 'AWS::Elasticsearch::Domain',
        Properties: {
          ElasticsearchVersion: '6.3',
          DomainName: 'images-search-${self:provider.stage}',
          ElasticsearchClusterConfig:{
            DedicatedMasterEnabled: false,
            InstanceCount: '1',
            ZoneAwarenessEnabled: false,
            InstanceType: 't2.small.elasticsearch'
          },
          EBSOptions: {
            EBSEnabled: true,
            Iops: 0,
            VolumeSize: 10,
            VolumeType: 'gp2'
          },
          AccessPolicies: {
            Version: '2012-10-17',
            Statement:[{
              Effect: 'Allow',
              Principal: {
                AWS: '*'
              },
              Action: 'es:*',
              Resource: { 'Fn::Sub': 'arn:aws:es:${self:provider.region}:${AWS::AccountId}:domain/images-search-${self:provider.stage}/*' },
              Condition:{
                IpAddress: { 'aws:SourceIp': ['129.205.113.11'] }
              }
            }]
          }
        }
      },
      ImagesTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          DisplayName: 'Images Bucket Topic',
          TopicName: '${self:custom.topicName}'
        }
      },
      SNSTopicPolicy: {
        Type: 'AWS::SNS::TopicPolicy',
        Properties: {
          PolicyDocument:{
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: '*'
                },
                Action: 'sns:Publish',
                Resource: { Ref: 'ImagesTopic' },
                Condition:{
                  ArnLike:{
                    'AWS:SourceArn':'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}'
                  }
                }
              }
            ]
          },
          Topics: [{ Ref: 'ImagesTopic' }]
        }
      },
      KMSKey: {
        Type: 'AWS::KMS::Key',
        Properties: {
          Description: "KMS Key to encrypt Auth0 certificate",
          KeyPolicy:{
            Id: "key-default-1",
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Allow administration of the key',
                Effect: 'Allow',
                Principal: {
                  AWS: { 'Fn::Join': [':', ['arn:aws:iam:', { Ref: 'AWS::AccountId' }, 'root']] }
                },
                Action: 'kms:*',
                Resource: '*'
              }
            ]
          }
        }
      },
      KMSKeyAlias: {
        Type: 'AWS::KMS::Alias',
        Properties: {
          AliasName: 'alias/auth0Key-${self:provider.stage}',
          TargetKeyId: { Ref: 'KMSKey' }
        }
      },
      Auth0Secret: {
        Type: 'AWS::SecretsManager::Secret',
        Properties: {
          Name: '${self:provider.environment.AUTH_0_SECRET_ID}',
          Description: "Auth0 RS256 certificate",
          KmsKeyId: { Ref: 'KMSKey' }
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
