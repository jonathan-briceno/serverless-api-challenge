const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

jest.mock("../src/utils/helpers", () => ({
  normalizeGameTitle: jest.fn(text => text.toUpperCase())
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
    GetCommand: jest.fn(),
    QueryCommand: jest.fn()
  };
});

const { handler } = require("../src/querySubmissions");

describe("querySubmissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockClear();
    process.env.VIDEO_GAME_SUBMISSIONS_TABLE = "TestTable";
  });

  test("returns 400 when no parameters provided", async () => {
    const event = {
      pathParameters: {},
      queryStringParameters: {}
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch("Please provide either");
  });

  test("returns 404 when submission not found by id", async () => {
    mockSend.mockResolvedValueOnce({ Item: null });

    const event = {
      pathParameters: { id: "nonexistent" },
      queryStringParameters: {}
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toBe("Submission not found");
  });

  test("returns 200 with submission when found by id", async () => {
    mockSend.mockResolvedValueOnce({
      Item: {
        submissionId: "123",
        userId: "user1",
        gameTitle: "Hollow Knight",
        hoursPlayed: 50
      }
    });

    const event = {
      pathParameters: { id: "123" },
      queryStringParameters: {}
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.submissionId).toBe("123");
    expect(body.gameTitle).toBe("Hollow Knight");
  });

  test("returns 200 with submissions when queried by userId", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        { submissionId: "1", userId: "user1", gameTitle: "Game1", hoursPlayed: 10 },
        { submissionId: "2", userId: "user1", gameTitle: "Game2", hoursPlayed: 20 }
      ]
    });

    const event = {
      pathParameters: {},
      queryStringParameters: { userId: "user1" }
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.count).toBe(2);
    expect(body.submissions).toHaveLength(2);
    expect(body.submissions[0].userId).toBe("user1");
  });

  test("returns 200 with empty array when no submissions found by userId", async () => {
    mockSend.mockResolvedValueOnce({
      Items: []
    });

    const event = {
      pathParameters: {},
      queryStringParameters: { userId: "user999" }
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.count).toBe(0);
    expect(body.submissions).toEqual([]);
  });

  test("returns 200 with submissions when queried by gameTitle", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        { submissionId: "1", userId: "user1", gameTitle: "HOLLOW KNIGHT", hoursPlayed: 45 },
        { submissionId: "2", userId: "user2", gameTitle: "HOLLOW KNIGHT", hoursPlayed: 60 }
      ]
    });

    const event = {
      pathParameters: {},
      queryStringParameters: { gameTitle: "Hollow Knight" }
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.count).toBe(2);
    expect(body.submissions).toHaveLength(2);
    expect(body.submissions[0].gameTitle).toBe("HOLLOW KNIGHT");
  });

  test("returns 500 on unexpected error", async () => {
    mockSend.mockRejectedValueOnce(new Error("DynamoDB unavailable"));

    const event = {
      pathParameters: { id: "123" },
      queryStringParameters: {}
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("Internal server error");
  });
});
