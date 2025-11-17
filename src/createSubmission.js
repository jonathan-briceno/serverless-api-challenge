const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.VIDEO_GAME_SUBMISSIONS_TABLE;

async function handler(event) {
    try {
        const body = JSON.parse(event.body);

        const {
            userId,
            gameTitle,
            hoursPlayed,
            platform,
            completionType,
            difficulty,
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

        const submission = {
            submissionId: randomUUID(),
            userId: userId,
            gameTitle: gameTitle,
            platform: platform,
            completionType: completionType,
            hoursPlayed: hoursPlayed,
            difficulty: difficulty || "N/A",
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
