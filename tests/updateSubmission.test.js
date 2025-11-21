const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

jest.mock("../src/constants", () => ({
  PLATFORMS: { PC: "PC", PS5: "PS5" },
  COMPLETION_TYPES: { MAIN_STORY: "main_story", COMPLETIONIST: "completionist" }
}));

jest.mock("../src/utils/helpers", () => ({
  normalizeText: jest.fn(text => text)
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
    UpdateCommand: jest.fn()
  };
});

const { handler } = require("../src/updateSubmission");

describe("updateSubmission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockClear();
    process.env.VIDEO_GAME_SUBMISSIONS_TABLE = "TestTable";
  });

  test("returns 400 when nothing to update", async () => {
    const event = {
      pathParameters: { id: "123" },
      body: JSON.stringify({})
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("Nothing to update");
  });

  test("returns 400 when hoursPlayed is negative", async () => {
    const event = {
      pathParameters: { id: "123" },
      body: JSON.stringify({ hoursPlayed: -5 })
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch("hoursPlayed must be greater than 0");
  });

  test("returns 400 for invalid platform", async () => {
    const event = {
      pathParameters: { id: "123" },
      body: JSON.stringify({ platform: "GameBoy" })
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch("Invalid platform");
  });

  test("returns 404 when submission not found", async () => {
    mockSend.mockRejectedValueOnce({ name: "ConditionalCheckFailedException" });

    const event = {
      pathParameters: { id: "123" },
      body: JSON.stringify({ hoursPlayed: 10 })
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toBe("Submission to update not found");
  });

  test("returns 200 on successful update", async () => {
    mockSend.mockResolvedValueOnce({
      Attributes: { submissionId: "123", hoursPlayed: 75 }
    });

    const event = {
      pathParameters: { id: "123" },
      body: JSON.stringify({ hoursPlayed: 75 })
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).hoursPlayed).toBe(75);
  });
});
