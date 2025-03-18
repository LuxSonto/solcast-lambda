import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export class SolcastLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Define the Lambda function
        const lambdaFunction = new lambda.Function(this, 'SolcastLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('dist'),
            memorySize: 256,
            timeout: cdk.Duration.seconds(60),
            environment: {
                DB_USER: process.env.DB_USER!,
                DB_HOST: process.env.DB_HOST!,
                DB_NAME: process.env.DB_NAME!,
                DB_PASSWORD: process.env.DB_PASSWORD!,
                DB_PORT: process.env.DB_PORT!,
            },
        });

        new events.Rule(this, 'ScheduleRule', {
            schedule: events.Schedule.rate(cdk.Duration.hours(1)),
            targets: [new targets.LambdaFunction(lambdaFunction)],
        });

        new cdk.CfnOutput(this, 'LambdaFunctionName', {
            value: lambdaFunction.functionName,
        });
    }
}