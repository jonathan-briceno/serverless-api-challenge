const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { PLATFORMS, COMPLETION_TYPES } = require('./constants');
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const { normalizeText } = require('./utils/helpers');

const TABLE_NAME = process.env.VIDEO_GAME_SUBMISSIONS_TABLE;

async function handler(event) {
    try {
        const { id } = event.pathParameters;
        const body = JSON.parse(event.body);

        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'submissionId is required' })
            };
        }

        // Fields that can be updated, pretty much all but game title 
        const { hoursPlayed, completionType, platform, notes } = body;

        // Validate hoursPlayed if provided
        if (hoursPlayed !== undefined && hoursPlayed <= 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'hoursPlayed must be greater than 0' })
            };
        }

        if (!PLATFORMS.includes(platform.toLowerCase())) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: `Invalid platform ${platform}, current valid platforms are ${PLATFORMS
                        .map(p => normalizeText(p))
                        .join(', ')}`
                })
            };
        }

        if (!COMPLETION_TYPES.includes(completionType.toLowerCase())) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: `Invalid completion type ${completionType}, current valid platforms are ${COMPLETION_TYPES
                        .join(', ')}`
                })
            };
        }

        // Check if nothing to update (all fields are undefined)
        if (hoursPlayed === undefined &&
            completionType === undefined &&
            platform === undefined &&
            notes === undefined) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Nothing to update' })
            };
        }

        // Build UpdateExpression based on provided fields
        let updateExpression = 'SET updatedAt = :updatedAt';
        const expressionAttributeValues = {
            ':updatedAt': new Date().toISOString()
        };

        if (hoursPlayed !== undefined) {
            updateExpression += ', hoursPlayed = :hoursPlayed';
            expressionAttributeValues[':hoursPlayed'] = hoursPlayed;
        }

        if (platform) {
            updateExpression += ', platform = :platform';
            expressionAttributeValues[':platform'] = platform;
        }

        if (completionType) {
            updateExpression += ', completionType = :completionType';
            expressionAttributeValues[':completionType'] = completionType.toLowerCase();
        }

        if (notes !== undefined) {
            updateExpression += ', notes = :notes';
            expressionAttributeValues[':notes'] = notes || null;
        }

        const result = await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { submissionId: id },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(submissionId)',
            ReturnValues: 'ALL_NEW'
        }));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result.Attributes)
        };

    } catch (error) {
        console.error('Error:', error);

        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Submission to update not found' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

module.exports = { handler };
