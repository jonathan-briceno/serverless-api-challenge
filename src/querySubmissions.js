const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { normalizeGameTitle } = require ('./utils/helpers');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.VIDEO_GAME_SUBMISSIONS_TABLE;

async function getBySubmissionId(id) {
    const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { submissionId: id }
    }));

    if (!result.Item) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Submission not found' })
        };
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(result.Item)
    };
}

async function getByUserId(userId) {
    const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'UserIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        ScanIndexForward: false
    }));

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            count: result.Items.length,
            submissions: result.Items
        })
    };
}

async function getByGameTitle(gameTitle) {
    const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GameIndex',
        KeyConditionExpression: 'gameTitle = :gameTitle',
        ExpressionAttributeValues: {
            ':gameTitle': normalizeGameTitle(gameTitle)
        },
        ScanIndexForward: false
    }));

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            count: result.Items.length,
            submissions: result.Items
        })
    };
}


async function handler(event) {
    try {
        
        const { id } = event.pathParameters || {};
        
        const { userId, gameTitle } = event.queryStringParameters || {};

        // Case 1: Get by submission ID
        if (id) {
            return await getBySubmissionId(id);
        }

        // Case 2: Get by userId
        if (userId) {
            return await getByUserId(userId);
        }

        // Case 3: Get by gameTitle
        if (gameTitle) {
            return await getByGameTitle(gameTitle);
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ 
                error: 'Please provide either an id in the path or userId/gameTitle as query parameters' 
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

module.exports = { handler };
