# GameTime API (Serverless API Challenge)
Track, submit, and analyze video game completion times (inspired by HowLongToBeat)

## What is our goal? 
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
---
### Query Submissions
`GET /submissions/{id}` - Get by submission ID  
`GET /submissions?userId={userId}` - Get all submissions by user  
`GET /submissions?gameTitle={gameTitle}` - Get all submissions by game title

Get submissions using multiple query modes: submission id, user id and game title. 

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
  "completionType": "any%",
  "difficulty": "N/A",
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
      "completionType": "any%",
      "createdAt": "2025-11-16T12:00:00.000Z",
      "updatedAt": "2025-11-16T12:00:00.000Z"
    },
    {
      "submissionId": "def-456",
      "userId": "user456",
      "gameTitle": "Elden Ring",
      "hoursPlayed": 120,
      "platform": "Playstation 5",
      "completionType": "100_percent",
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
  "count": 3,
  "submissions": [
    {
      "submissionId": "abc-123",
      "userId": "user123",
      "gameTitle": "Hollow Knight",
      "hoursPlayed": 57,
      "platform": "Playstation 4",
      "completionType": "any%",
      "createdAt": "2025-11-16T12:00:00.000Z"
    },
    {
      "submissionId": "ghi-789",
      "userId": "sarah",
      "gameTitle": "Donkey Kong Bananza",
      "hoursPlayed": 45,
      "platform": "Switch 2",
      "completionType": "100_percent",
      "createdAt": "2025-11-16T11:00:00.000Z"
    }
  ]
}
```

**Note:** Game title search is case-insensitive. All of these work!:
- `?gameTitle=Hollow Knight`
- `?gameTitle=hollow knight`
- `?gameTitle=HOLLOW KNIGHT`

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

**Error Responses:**
- `404 Not Found` - Submission doesn't exist
```json
{
  "error": "Submission not found"
}
```
---

### Update Submission
`PUT /submissions/{id}`

Update an existing submission. Fields that can be updated: `hoursPlayed`, `completionType`, `platform`, `difficulty`, `notes`

**Request:**
```bash
PATCH /submissions/abc-123-def-456
```

**Request Body (all fields optional):**
```json
{
  "hoursPlayed": 75,
  "platform": "PC",
  "completionType": "100_percent",
  "difficulty": "hard",
  "notes": "Beat the final boss!"
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
  "completionType": "100_percent",
  "difficulty": "hard",
  "notes": "Beat the final boss!",
  "createdAt": "2025-11-16T10:30:00.000Z",
  "updatedAt": "2025-11-17T14:22:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Submission doesn't exist
```json
{
  "error": "Submission to update not found"
}
```
- `400 Bad Request` - Invalid data
```json
{
  "error": "hoursPlayed must be greater than 0"
}
```

---