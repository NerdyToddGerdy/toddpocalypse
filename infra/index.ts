import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const googleClientId = config.requireSecret("googleClientId");
const googleClientSecret = config.requireSecret("googleClientSecret");

const region = aws.config.region ?? "us-east-1";
const gameOrigins = [
    "http://localhost:8080",
    "https://nerdytoddgerdy.github.io/toddpocalypse",
];

// ── DynamoDB ────────────────────────────────────────────────────────────────
const saveTable = new aws.dynamodb.Table("toddpocalypse-saves", {
    name: "toddpocalypse-saves",
    attributes: [{ name: "userId", type: "S" }],
    hashKey: "userId",
    billingMode: "PAY_PER_REQUEST",
});

// ── Cognito User Pool ────────────────────────────────────────────────────────
const userPool = new aws.cognito.UserPool("toddpocalypse-users", {
    name: "toddpocalypse-users",
    usernameAttributes: ["email"],
    autoVerifiedAttributes: ["email"],
    adminCreateUserConfig: { allowAdminCreateUserOnly: false },
});

const googleIdp = new aws.cognito.IdentityProvider("google-idp", {
    userPoolId: userPool.id,
    providerName: "Google",
    providerType: "Google",
    providerDetails: {
        client_id: googleClientId,
        client_secret: googleClientSecret,
        authorize_scopes: "email profile openid",
    },
    attributeMapping: {
        email: "email",
        username: "sub",
    },
});

const userPoolDomain = new aws.cognito.UserPoolDomain("toddpocalypse-domain", {
    domain: "toddpocalypse-auth",
    userPoolId: userPool.id,
}, { dependsOn: [userPool] });

const userPoolClient = new aws.cognito.UserPoolClient("toddpocalypse-client", {
    userPoolId: userPool.id,
    name: "toddpocalypse-web",
    generateSecret: false,
    allowedOauthFlows: ["implicit"],
    allowedOauthScopes: ["email", "openid", "profile"],
    allowedOauthFlowsUserPoolClient: true,
    callbackUrls: gameOrigins,
    logoutUrls: gameOrigins,
    supportedIdentityProviders: ["Google"],
}, { dependsOn: [googleIdp] });

// ── IAM role for Lambda ──────────────────────────────────────────────────────
const lambdaRole = new aws.iam.Role("toddpocalypse-lambda-role", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "lambda.amazonaws.com",
    }),
});

new aws.iam.RolePolicyAttachment("lambda-basic-exec", {
    role: lambdaRole.name,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

const dynamoPolicy = new aws.iam.Policy("toddpocalypse-dynamo-policy", {
    policy: saveTable.arn.apply(arn => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: ["dynamodb:GetItem", "dynamodb:PutItem"],
            Resource: arn,
        }],
    })),
});

new aws.iam.RolePolicyAttachment("lambda-dynamo-attach", {
    role: lambdaRole.name,
    policyArn: dynamoPolicy.arn,
});

// ── Lambda: GET /save ────────────────────────────────────────────────────────
const getSaveFn = new aws.lambda.Function("toddpocalypse-getSave", {
    name: "toddpocalypse-getSave",
    runtime: aws.lambda.Runtime.NodeJS20dX,
    role: lambdaRole.arn,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const client = new DynamoDBClient({});

exports.handler = async (event) => {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) return { statusCode: 401, body: "Unauthorized" };
    try {
        const result = await client.send(new GetItemCommand({
            TableName: process.env.TABLE_NAME,
            Key: { userId: { S: userId } },
        }));
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: result.Item?.data?.S ?? null,
        };
    } catch (e) {
        console.error(e);
        return { statusCode: 500, body: "Internal error" };
    }
};
        `),
    }),
    environment: { variables: { TABLE_NAME: saveTable.name } },
    timeout: 10,
});

// ── Lambda: PUT /save ────────────────────────────────────────────────────────
const putSaveFn = new aws.lambda.Function("toddpocalypse-putSave", {
    name: "toddpocalypse-putSave",
    runtime: aws.lambda.Runtime.NodeJS20dX,
    role: lambdaRole.arn,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const client = new DynamoDBClient({});

exports.handler = async (event) => {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) return { statusCode: 401, body: "Unauthorized" };
    const body = event.body;
    if (!body) return { statusCode: 400, body: "Missing body" };
    try {
        await client.send(new PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                userId: { S: userId },
                data: { S: body },
                updatedAt: { S: new Date().toISOString() },
            },
        }));
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: "OK",
        };
    } catch (e) {
        console.error(e);
        return { statusCode: 500, body: "Internal error" };
    }
};
        `),
    }),
    environment: { variables: { TABLE_NAME: saveTable.name } },
    timeout: 10,
});

// ── API Gateway HTTP API ─────────────────────────────────────────────────────
const api = new aws.apigatewayv2.Api("toddpocalypse-api", {
    name: "toddpocalypse-api",
    protocolType: "HTTP",
    corsConfiguration: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "PUT", "OPTIONS"],
        allowHeaders: ["Authorization", "Content-Type"],
    },
});

const authorizer = new aws.apigatewayv2.Authorizer("cognito-jwt", {
    apiId: api.id,
    authorizerType: "JWT",
    identitySources: ["$request.header.Authorization"],
    jwtConfiguration: {
        audiences: [userPoolClient.id],
        issuer: pulumi.interpolate`https://cognito-idp.${region}.amazonaws.com/${userPool.id}`,
    },
});

const getSaveIntegration = new aws.apigatewayv2.Integration("getSave-int", {
    apiId: api.id,
    integrationType: "AWS_PROXY",
    integrationUri: getSaveFn.arn,
    payloadFormatVersion: "2.0",
});

const putSaveIntegration = new aws.apigatewayv2.Integration("putSave-int", {
    apiId: api.id,
    integrationType: "AWS_PROXY",
    integrationUri: putSaveFn.arn,
    payloadFormatVersion: "2.0",
});

new aws.apigatewayv2.Route("get-save-route", {
    apiId: api.id,
    routeKey: "GET /save",
    authorizationType: "JWT",
    authorizerId: authorizer.id,
    target: pulumi.interpolate`integrations/${getSaveIntegration.id}`,
});

new aws.apigatewayv2.Route("put-save-route", {
    apiId: api.id,
    routeKey: "PUT /save",
    authorizationType: "JWT",
    authorizerId: authorizer.id,
    target: pulumi.interpolate`integrations/${putSaveIntegration.id}`,
});

const stage = new aws.apigatewayv2.Stage("default-stage", {
    apiId: api.id,
    name: "$default",
    autoDeploy: true,
});

new aws.lambda.Permission("getSave-apigw", {
    action: "lambda:InvokeFunction",
    function: getSaveFn.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

new aws.lambda.Permission("putSave-apigw", {
    action: "lambda:InvokeFunction",
    function: putSaveFn.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

// ── Outputs ──────────────────────────────────────────────────────────────────
export const apiUrl = stage.invokeUrl;
export const userPoolId = userPool.id;
export const userPoolClientId = userPoolClient.id;
export const cognitoDomain = pulumi.interpolate`https://toddpocalypse-auth.auth.${region}.amazoncognito.com`;
export const cognitoLoginUrl = pulumi.interpolate`https://toddpocalypse-auth.auth.${region}.amazoncognito.com/login?client_id=${userPoolClient.id}&response_type=token&scope=email+openid+profile&redirect_uri=http://localhost:8080`;
export const cognitoGoogleCallbackUrl = pulumi.interpolate`https://toddpocalypse-auth.auth.${region}.amazoncognito.com/oauth2/idpresponse`;