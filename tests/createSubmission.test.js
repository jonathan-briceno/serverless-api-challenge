const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const helpers = require('../src/utils/helpers');
const constants = require('../src/constants'); 

const mockSend = jest.fn().mockResolvedValue({});
const mockDocClientInstance = { send: mockSend };

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({})),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const original = jest.requireActual('@aws-sdk/lib-dynamodb');

  return {
    ...original,
    DynamoDBDocumentClient: {
      from: jest.fn(() => mockDocClientInstance)
    }
  };
});

jest.mock('../src/utils/helpers', () => ({
    normalizeText: jest.fn(text => text.toUpperCase()),
}));

jest.mock('../src/constants', () => ({
    PLATFORMS: { PC: 'PC', PS5: 'PS5' },
    COMPLETION_TYPES: { MAIN_STORY: 'Main Story', COMPLETIONIST: 'Completionist' },
}));


const { handler } = require('../src/createSubmission');

process.env.VIDEO_GAME_SUBMISSIONS_TABLE = "VideoGameSubmissions";

beforeEach(() => {
  jest.restoreAllMocks(); 
  mockSend.mockReset();
  mockSend.mockResolvedValue({});
});

describe("createSubmission handler", () => {

  test("returns 400 if required fields missing", async () => {
    const event = {
      body: JSON.stringify({
        userId: "123",
        gameTitle: "Zelda",
        hoursPlayed: -1,
      })
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch("Missing required fields");
  });

  test("returns 400 if hoursPlayed <= 0", async () => {
    const event = {
      body: JSON.stringify({
        userId: "123",
        gameTitle: "Zelda",
        hoursPlayed: 0,
        platform: "PC",
        completionType: "Main Story"
      })
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch("Missing required fields, please check: userId, gameTitle, hoursPlayed, platform,  completionType, and hoursPlayed cannot be 0");
  });

  test("returns 400 for invalid platform", async () => {
    const event = {
      body: JSON.stringify({
        userId: "123",
        gameTitle: "Zelda",
        hoursPlayed: 10,
        platform: "GameBoy",
        completionType: "Main Story"
      })
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch("Invalid platform");
  });

  test("returns 400 for invalid completion type", async () => {
    const event = {
      body: JSON.stringify({
        userId: "123",
        gameTitle: "Zelda",
        hoursPlayed: 10,
        platform: "PC",
        completionType: "speedrun"
      })
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch("Invalid completion type");
  });

  test("returns 500 if DynamoDB throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("DynamoDB Error"));

    const event = {
      body: JSON.stringify({
        userId: "1",
        gameTitle: "Zelda",
        hoursPlayed: 5,
        platform: "PC",
        completionType: "Main Story"
      })
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("Internal server error");
  });

});
