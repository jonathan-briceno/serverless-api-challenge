# GameTime API
Track, submit, and analyze video game completion times (inspired by HowLongToBeat)

## Overview
A serverless REST API built with AWS Lambda, API Gateway, and DynamoDB that allows users to submit and track video game completion times across different platforms and play styles.

## Tech Stack
- **Serverless Framework** - Infrastructure as Code
- **AWS Lambda** - Serverless compute (Node.js 22.x)
- **Amazon DynamoDB** - NoSQL database with Global Secondary Indexes
- **API Gateway** - HTTP API endpoints
- **GitHub Actions** - CI/CD pipeline for automated testing and deployments

---

## API Endpoints

### Create Submission
`POST /submissions`

Submit a new game completion time.

**Request Body:**
```json
{
  "userId": "user123",
  "gameTitle": "Hollow Knight",
  "hoursPlayed": 57,
  "platform": "Playstation 4",
  "completionType": "main story",
  "notes": "Amazing game!"
}
```

**Valid Platforms:**
- `Playstation 5`, `Playstation 4`, `Xbox One`, `Switch`, `Switch 2`, `PC`

**Valid Completion Types:**
- `main story`, `main + extras`, `completionist`

**Response:** `201 Created`
```json
{
  "submissionId": "abc-123-def",
  "userId": "user123",
  "gameTitle": "Hollow Knight",
  "hoursPlayed": 57,
  "platform": "Playstation 4",
  "completionType": "main story",
  "notes": "Amazing game!",
  "createdAt": "2025-11-16T10:30:00.000Z",
  "updatedAt": "2025-11-16T10:30:00.000Z"
}
```

**Error Responses:**

`400 Bad Request` - Missing required fields
```json
{
  "error": "Missing required fields, please check: userId, gameTitle, hoursPlayed, platform, completionType, and hoursPlayed cannot be 0"
}
```

`400 Bad Request` - Invalid hours played
```json
{
  "error": "hoursPlayed must be greater than 0"
}
```

`400 Bad Request` - Invalid platform
```json
{
  "error": "Invalid platform Sega Saturn, current valid platforms are Playstation 5, Playstation 4, Switch, Switch 2, Xbox One, PC"
}
```

`400 Bad Request` - Invalid completion type
```json
{
  "error": "Invalid completion type speedrun, current valid types are Main Story, Main + Extras, Completionist"
}
```

---

### Query Submissions (Multiple Modes)
`GET /submissions/{id}` - Get by submission ID  
`GET /submissions?userId={userId}` - Get all submissions by user  
`GET /submissions?gameTitle={gameTitle}` - Get all submissions by game title

#### Get Single Submission by ID
**Request:**
```bash
GET /submissions/abc-123-def-456
```

**Response:** `200 OK`
```json
{
  "submissionId": "abc-123-def-456",
  "userId": "user123",
  "gameTitle": "Hollow Knight",
  "hoursPlayed": 57,
  "platform": "Playstation 4",
  "completionType": "main story",
  "notes": "Cool!",
  "createdAt": "2025-11-16T10:30:00.000Z",
  "updatedAt": "2025-11-16T10:30:00.000Z"
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Submission not found"
}
```

#### Get All Submissions by User
**Request:**
```bash
GET /submissions?userId=user123
```

**Response:** `200 OK`
```json
{
  "count": 2,
  "submissions": [
    {
      "submissionId": "abc-123",
      "userId": "user123",
      "gameTitle": "Hollow Knight",
      "hoursPlayed": 57,
      "platform": "Playstation 4",
      "completionType": "main story",
      "createdAt": "2025-11-16T12:00:00.000Z",
      "updatedAt": "2025-11-16T12:00:00.000Z"
    },
    {
      "submissionId": "def-456",
      "userId": "user123",
      "gameTitle": "Elden Ring",
      "hoursPlayed": 120,
      "platform": "PC",
      "completionType": "completionist",
      "createdAt": "2025-11-16T10:30:00.000Z",
      "updatedAt": "2025-11-16T10:30:00.000Z"
    }
  ]
}
```

#### Get All Submissions by Game Title
**Request:**
```bash
GET /submissions?gameTitle=Hollow Knight
```

**Response:** `200 OK`
```json
{
  "count": 2,
  "submissions": [
    {
      "submissionId": "abc-123",
      "userId": "user123",
      "gameTitle": "Hollow Knight",
      "hoursPlayed": 57,
      "platform": "Playstation 4",
      "completionType": "main story",
      "createdAt": "2025-11-16T12:00:00.000Z"
    },
    {
      "submissionId": "ghi-789",
      "userId": "sarah",
      "gameTitle": "Hollow Knight",
      "hoursPlayed": 45,
      "platform": "Switch",
      "completionType": "completionist",
      "createdAt": "2025-11-16T11:00:00.000Z"
    }
  ]
}
```

**Note:** Game title search is case-insensitive:
- `?gameTitle=Hollow Knight`
- `?gameTitle=hollow knight`
- `?gameTitle=HOLLOW KNIGHT`

---

### Update Submission
`PATCH /submissions/{id}`

Update specific fields of an existing submission. You can update: `hoursPlayed`, `completionType`, `platform`, `notes`

**Note:** Game title cannot be updated. To change the game, delete and create a new submission.

**Request:**
```bash
PATCH /submissions/abc-123-def-456
```

**Request Body (all fields optional):**
```json
{
  "hoursPlayed": 75,
  "platform": "PC",
  "completionType": "completionist",
  "notes": "Side quests are nuts"
}
```

**Response:** `200 OK`
```json
{
  "submissionId": "abc-123-def-456",
  "userId": "user123",
  "gameTitle": "Hollow Knight",
  "hoursPlayed": 75,
  "platform": "PC",
  "completionType": "completionist",
  "notes": "Side quests are nuts",
  "createdAt": "2025-11-16T10:30:00.000Z",
  "updatedAt": "2025-11-17T14:22:00.000Z"
}
```

**Error Responses:**

`404 Not Found` - Submission doesn't exist
```json
{
  "error": "Submission to update not found"
}
```

`400 Bad Request` - Nothing to update
```json
{
  "error": "Nothing to update"
}
```

`400 Bad Request` - Invalid hours played
```json
{
  "error": "hoursPlayed must be greater than 0"
}
```

`400 Bad Request` - Invalid platform
```json
{
  "error": "Invalid platform Game Boy, current valid platforms are Playstation 5, Playstation 4, Switch, Switch 2, Xbox One, PC"
}
```

---

### Delete Submission
`DELETE /submissions/{id}`

Delete a specific submission.

**Request:**
```bash
DELETE /submissions/abc-123-def-456
```

**Response:** `200 OK`
```json
{
  "message": "Submission deleted successfully",
  "submissionId": "abc-123-def-456"
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Submission not found"
}
```

---

### Get Game Statistics
`GET /games/{gameTitle}/stats`

Get aggregated statistics for a specific game including averages, counts, and breakdowns by completion type and platform.

**Request:**
```bash
GET /games/Hollow%20Knight/stats
```

**Response:** `200 OK`
```json
{
  "gameTitle": "Hollow Knight",
  "totalSubmissions": 5,
  "overall": {
    "average": 62.4,
    "min": 45,
    "max": 85
  },
  "byCompletionType": {
    "Main Story": {
      "count": 3,
      "average": 55.3,
      "min": 45,
      "max": 67
    },
    "Completionist": {
      "count": 2,
      "average": 77.5,
      "min": 70,
      "max": 85
    }
  },
  "byPlatform": {
    "PC": {
      "count": 2,
      "average": 60.0,
      "min": 55,
      "max": 65
    },
    "Playstation 4": {
      "count": 2,
      "average": 61.0,
      "min": 57,
      "max": 65
    }
  }
}
```

**Response Notes:**
- Only includes completion types and platforms that have submissions
- All averages rounded to 1 decimal place
- Statistics calculated from all submissions for the specified game

**Error Response:** `404 Not Found`
```json
{
  "error": "No submissions found for this game",
  "gameTitle": "Hollow Knight"
}
```

---

## CI/CD Pipeline

This project uses GitHub Actions for automated testing and controlled deployments.

### Workflows

**Deploy to AWS**
- Manual trigger via GitHub Actions UI
- Deploy to any environment: dev, qa, stage, or prod
- Tests run before deployment

**Evironments:**
- Dev: `gametime-api-dev`
- QA: `gametime-api-qa`
- Stage: `gametime-api-stage`
- Prod: `gametime-api-prod`

---

## Local Development

### Prerequisites
- Node.js 22.x
- AWS CLI configured with credentials
- Serverless Framework

### Setup
```bash
# Install dependencies
npm install

# Run tests
npm test

# Deploy to dev
serverless deploy --stage dev

# Remove infrastructure
serverless remove --stage dev
```

### Environment Variables
The following environment variables are automatically set by Serverless Framework:
- `VIDEO_GAME_SUBMISSIONS_TABLE` - DynamoDB table name

---

## Project Structure 

Generated with `tree -a -L 3 -I 'node_modules|.git|.DS_Store|.serverless'`

```
gametime-api/
├── .github
│   └── workflows
│       ├── deploy.yml
│       └── test.yml
├── .gitignore
├── LICENSE
├── README.md
├── jest.config.js
├── package-lock.json
├── package.json
├── serverless.yml
├── src
│   ├── constants.js
│   ├── createSubmission.js
│   ├── deleteSubmission.js
│   ├── getGameStats.js
│   ├── querySubmissions.js
│   ├── updateSubmission.js
│   └── utils
│       └── helpers.js
└── tests
    ├── createSubmission.test.js
    ├── deleteSubmission.test.js
    ├── getGameStats.test.js
    ├── querySubmission.test.js
    └── updateSubmission.test.js
```

---

## Testing

Comprehensive test coverage for all endpoints:

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/createSubmission.test.js
```

---

## Built by Jonathan Briceño 