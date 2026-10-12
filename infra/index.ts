import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const googleClientId = config.requireSecret("googleClientId");
const googleClientSecret = config.requireSecret("googleClientSecret");

const region = aws.config.region ?? "us-east-1";
// Full URLs: where sign-in may redirect back to.
const gameOrigins = [
    "http://localhost:8000",
    "http://localhost:8080",
    "https://nerdytoddgerdy.github.io/toddpocalypse",
];
// Bare origins for CORS. A browser's Origin header never carries a path, so
// "https://nerdytoddgerdy.github.io/toddpocalypse" never matched and the live
// game's every request was blocked as "Could not reach the server".
const corsOrigins = [
    "http://localhost:8000",
    "http://localhost:8080",
    "https://nerdytoddgerdy.github.io",
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
}, {
    // Cognito fills these Google defaults in after creation; leave them be so
    // unrelated deploys don't touch sign-in.
    ignoreChanges: [
        "providerDetails.attributes_url",
        "providerDetails.attributes_url_add_attributes",
        "providerDetails.authorize_url",
        "providerDetails.oidc_issuer",
        "providerDetails.token_request_method",
        "providerDetails.token_url",
    ],
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
            Action: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:BatchGetItem"],
            Resource: arn,
        }],
    })),
});

new aws.iam.RolePolicyAttachment("lambda-dynamo-attach", {
    role: lambdaRole.name,
    policyArn: dynamoPolicy.arn,
});

// ── Lambda: the save API (five named slots per player) ─────────────────────
// The routes live in lambda/saves-core.mjs, which the game's tests cover.
const savesFn = new aws.lambda.Function("toddpocalypse-saves", {
    reservedConcurrentExecutions: 10,
    name: "toddpocalypse-saves",
    runtime: aws.lambda.Runtime.NodeJS20dX,
    role: lambdaRole.arn,
    handler: "saves.handler",
    code: new pulumi.asset.FileArchive("./lambda"),
    environment: { variables: { TABLE_NAME: saveTable.name, ALLOWED_ORIGINS: corsOrigins.join(",") } },
    timeout: 10,
});

// ── API Gateway HTTP API ─────────────────────────────────────────────────────
const api = new aws.apigatewayv2.Api("toddpocalypse-api", {
    name: "toddpocalypse-api",
    protocolType: "HTTP",
    corsConfiguration: {
        allowOrigins: corsOrigins,
        allowMethods: ["GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Authorization", "Content-Type", "X-Session-Id", "X-Force-Session"],
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

const savesIntegration = new aws.apigatewayv2.Integration("saves-int", {
    apiId: api.id,
    integrationType: "AWS_PROXY",
    integrationUri: savesFn.arn,
    payloadFormatVersion: "2.0",
});

// Resource names of the first two routes predate the slots; keeping them updates in place.
const saveRoutes: [string, string][] = [
    ["get-save-route", "GET /save"],
    ["put-save-route", "PUT /save"],
    ["patch-save-route", "PATCH /save"],
    ["delete-save-route", "DELETE /save"],
    ["list-saves-route", "GET /saves"],
];
for (const [name, routeKey] of saveRoutes) {
    new aws.apigatewayv2.Route(name, {
        apiId: api.id,
        routeKey,
        authorizationType: "JWT",
        authorizerId: authorizer.id,
        target: pulumi.interpolate`integrations/${savesIntegration.id}`,
    });
}

const stage = new aws.apigatewayv2.Stage("default-stage", {
    apiId: api.id,
    name: "$default",
    autoDeploy: true,
    defaultRouteSettings: {
        throttlingBurstLimit: 20,
        throttlingRateLimit: 10,
    },
});

new aws.lambda.Permission("saves-apigw", {
    action: "lambda:InvokeFunction",
    function: savesFn.name,
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