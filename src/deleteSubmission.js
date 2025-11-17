const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.VIDEO_GAME_SUBMISSIONS_TABLE;

async function handler(event) {
    try {
        const { id } = event.pathParameters;

        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'submissionId is required' })
            };
        }

        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { submissionId: id },
            ConditionExpression: 'attribute_exists(submissionId)'
        }));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                message: 'Submission deleted successfully',
                submissionId: id
            })
        };

    } catch (error) {
        console.error('Error:', error);
        
        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Submission not found' })
            };
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}

module.exports = { handler };
