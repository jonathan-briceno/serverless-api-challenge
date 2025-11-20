const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const { normalizeText } = require('./utils/helpers');
const { PLATFORMS, COMPLETION_TYPES } = require('./constants');

const TABLE_NAME = process.env.VIDEO_GAME_SUBMISSIONS_TABLE;
const PLATFORM_VALUES = Object.values(PLATFORMS).map(p => p.toLowerCase());
const COMPLETION_TYPE_VALUES = Object.values(COMPLETION_TYPES).map(t => t.toLowerCase());

async function handler(event) {
    try {
        const body = JSON.parse(event.body);

        const {
            userId,
            gameTitle,
            hoursPlayed,
            platform,
            completionType,
            notes,
        } = body;

        if (!userId || !gameTitle || !hoursPlayed || !platform || !completionType) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields, please check: userId, gameTitle, hoursPlayed, platform,  completionType' })
            };
        }

        if (hoursPlayed <= 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'You must have played at least one hour to make a submission' })
            };
        }

if (!PLATFORM_VALUES.includes(platform.toLowerCase())) {
    return {
        statusCode: 400,
        body: JSON.stringify({
            error: `Invalid platform ${platform}, current valid platforms are ${Object.values(PLATFORMS).join(', ')}`
        })
    };
}

if (!COMPLETION_TYPE_VALUES.includes(completionType.toLowerCase())) {
    return {
        statusCode: 400,
        body: JSON.stringify({
            error: `Invalid completion type ${completionType}, current valid types are ${Object.values(COMPLETION_TYPES).join(', ')}`
        })
    };
}


        const submission = {
            submissionId: randomUUID(),
            userId: userId,
            gameTitle: normalizeText(gameTitle),
            platform: normalizeText(platform),
            completionType: completionType.toLowerCase(),
            hoursPlayed: hoursPlayed,
            notes: notes || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to DynamoDB
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: submission
        }));

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(submission)
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
