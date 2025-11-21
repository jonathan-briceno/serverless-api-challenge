const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

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
    DeleteCommand: jest.fn()
  };
});

const { handler } = require("../src/deleteSubmission");

describe("deleteSubmission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockClear();
    process.env.VIDEO_GAME_SUBMISSIONS_TABLE = "TestTable";
  });

  test("returns 400 when submissionId is missing", async () => {
    const event = {
      pathParameters: {}
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("submissionId is required");
    expect(mockSend).not.toHaveBeenCalled();
  });

  test("returns 404 when submission not found", async () => {
    mockSend.mockRejectedValueOnce({ name: "ConditionalCheckFailedException" });

    const event = {
      pathParameters: { id: "nonexistent" }
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toBe("Submission not found");
  });

  test("returns 200 on successful deletion", async () => {
    mockSend.mockResolvedValueOnce({});

    const event = {
      pathParameters: { id: "123" }
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.message).toBe("Submission deleted successfully");
    expect(body.submissionId).toBe("123");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("returns 500 on unexpected error", async () => {
    mockSend.mockRejectedValueOnce(new Error("DynamoDB unavailable"));

    const event = {
      pathParameters: { id: "123" }
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("Internal server error");
  });
});
