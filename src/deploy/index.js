import awsServerlessExpress from 'aws-serverless-express';
import app from './../app';
import makeLambdaHandler from './lambda';

const lambdaHandler = makeLambdaHandler({ awsServerlessExpress, app });

export { lambdaHandler };
