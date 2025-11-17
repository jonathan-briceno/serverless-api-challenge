# GameTime API (Serverless API Challenge)
Track, submit, and analyze video game completion times (inspired by HowLongToBeat)

## What is out goal? 
A serverless REST API built with AWS Lambda, API Gateway, and DynamoDB that allows users to submit and track video game completion times across different platforms and play styles.

## Tech Stack
- **Serverless Framework** - Infrastructure as Code
- **AWS Lambda** - Serverless compute (Node.js 22.x)
- **Amazon DynamoDB** - NoSQL database
- **API Gateway** - REST API endpoints

## API Endpoints

### Create Submission
`POST /submissions`

Submit a game completion time.

**Request Body:**
```json
{
  "userId": "user123",
  "gameTitle": "Hollow Knight",
  "hoursPlayed": 57,
  "platform": "Playstation 4",
  "completionType": "any%",
  "difficulty": "N/A",
  "notes": "Amazing game!"
}
```

**Response:** `201 Created`
```json
{
  "submissionId": "abc-123-def",
  "userId": "user123",
  "gameTitle": "Hollow Knight",
  "hoursPlayed": 57,
  "platform": "Playstation 4",
  "completionType": "any%",
  "difficulty": "N/A",
  "notes": "Amazing game!",
  "createdAt": "2025-11-16T10:30:00.000Z",
  "updatedAt": "2025-11-16T10:30:00.000Z"
}
```
