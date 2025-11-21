const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

jest.mock("../src/utils/helpers", () => ({
  normalizeText: jest.fn(text => text.toUpperCase())
}));

jest.mock("../src/constants", () => ({
  PLATFORMS: { PC: "PC", PS5: "PS5" },
  COMPLETION_TYPES: { 
    MAIN_STORY: "main_story", 
    MAIN_PLUS_EXTRAS: "main_plus_extras",
    COMPLETIONIST: "completionist" 
  }
}));

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({}))
}));

const mockSend = jest.fn();

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const original = jest.requireActual("@aws-sdk/lib-dynamodb");
  return {
    ...original,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({ 
        send: mockSend
      }))
    },
    QueryCommand: jest.fn()
  };
});

const { handler } = require("../src/getGameStats");

describe("getGameStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockClear();
    process.env.VIDEO_GAME_SUBMISSIONS_TABLE = "TestTable";
  });

  test("returns 400 when gameTitle is missing", async () => {
    const event = {
      pathParameters: {}
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("gameTitle is required");
  });

  test("returns 404 when no submissions found", async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    const event = {
      pathParameters: { gameTitle: "Unknown Game" }
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toBe("No submissions found for this game");
  });

  test("returns 200 with stats when submissions found", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        { 
          submissionId: "1", 
          gameTitle: "HOLLOW KNIGHT", 
          hoursPlayed: 50, 
          platform: "PC",
          completionType: "main_story"
        },
        { 
          submissionId: "2", 
          gameTitle: "HOLLOW KNIGHT", 
          hoursPlayed: 70, 
          platform: "PS5",
          completionType: "completionist"
        }
      ]
    });

    const event = {
      pathParameters: { gameTitle: "Hollow Knight" }
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.gameTitle).toBe("HOLLOW KNIGHT");
    expect(body.totalSubmissions).toBe(2);
    expect(body.overall.average).toBe(60);
    expect(body.overall.min).toBe(50);
    expect(body.overall.max).toBe(70);
  });

  test("returns 500 on unexpected error", async () => {
    mockSend.mockRejectedValueOnce(new Error("DynamoDB unavailable"));

    const event = {
      pathParameters: { gameTitle: "Test Game" }
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("Internal server error");
  });
});
