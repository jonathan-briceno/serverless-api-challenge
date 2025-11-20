const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { normalizeText } = require('./utils/helpers');
const { PLATFORMS, COMPLETION_TYPES } = require('./constants');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.VIDEO_GAME_SUBMISSIONS_TABLE;

function calculateAverage(arr) {
    if (!arr || arr.length === 0) return null;

    let sum = 0;
    for (const val of arr) {
        sum += val;
    }

    return Math.round((sum / arr.length) * 10) / 10;
}

function getStats(arr) {
    if (!arr || arr.length === 0) return null;
    return {
        count: arr.length,
        average: calculateAverage(arr),
        min: Math.min(...arr),
        max: Math.max(...arr)
    };
}

function calculateStats(submissions, gameTitle) {
    const submissionByCompletionType = {
        [COMPLETION_TYPES.MAIN_STORY]: [],
        [COMPLETION_TYPES.MAIN_PLUS_EXTRAS]: [],
        [COMPLETION_TYPES.COMPLETIONIST]: []
    };

    const submissionByPlatform = {
        [PLATFORMS.PLAYSTATION_5]: [],
        [PLATFORMS.PLAYSTATION_4]: [],
        [PLATFORMS.SWITCH]: [],
        [PLATFORMS.SWITCH_2]: [],
        [PLATFORMS.XBOX_ONE]: [],
        [PLATFORMS.PC]: []
    };

    let totalHours = 0;
    const allHours = [];

    submissions.forEach(submission => {
        totalHours += submission.hoursPlayed;
        allHours.push(submission.hoursPlayed);

        if (submissionByCompletionType[submission.completionType]) {
            submissionByCompletionType[submission.completionType].push(submission.hoursPlayed);
        }

        if (submissionByPlatform[submission.platform]) {
            submissionByPlatform[submission.platform].push(submission.hoursPlayed);
        }
    });

    const completionTypeStats = {};
    Object.keys(submissionByCompletionType).forEach(type => {
        const stats = getStats(submissionByCompletionType[type]);
        if (stats) {
            completionTypeStats[type] = stats;
        }
    });

    const platformStats = {};
    Object.keys(submissionByPlatform).forEach(platform => {
        const stats = getStats(submissionByPlatform[platform]);
        if (stats) {
            platformStats[platform] = stats;
        }
    });

    return {
        gameTitle,
        totalSubmissions: submissions.length,
        overall: {
            average: calculateAverage(allHours),
            min: Math.min(...allHours),
            max: Math.max(...allHours)
        },
        byCompletionType: completionTypeStats,
        byPlatform: platformStats
    };
}

async function handler(event) {
    try {
        const { gameTitle } = event.pathParameters;

        if (!gameTitle) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'gameTitle is required' })
            };
        }

        // decode potential blank spaces from %20, i.e Hollow%20Knight the actual blank space: Hollow Knight
        const normalizedTitle = normalizeText(decodeURIComponent(gameTitle));

        const result = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'GameIndex',
                KeyConditionExpression: 'gameTitle = :gameTitle',
                ExpressionAttributeValues: {
                    ':gameTitle': normalizedTitle
                }
            })
        );

        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: 'No submissions found for this game',
                    gameTitle: normalizedTitle
                })
            };
        }

        const stats = calculateStats(result.Items, normalizedTitle);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(stats)
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
