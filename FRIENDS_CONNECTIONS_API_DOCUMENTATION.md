# Friends/Connections System API Documentation

## Overview
This document describes the complete friends/connections system with notifications that has been implemented for the football app.

## Database Schema

### Tables Created

#### 1. `player_connections`
- `id` - UUID primary key
- `player_id` - References players(id) - The player who sent the request
- `connected_player_id` - References players(id) - The player who received the request
- `status` - ENUM('pending', 'accepted', 'rejected') - Connection status
- `requested_at` - Timestamp when request was sent
- `responded_at` - Timestamp when request was responded to (accepted/rejected)

#### 2. `notifications`
- `id` - UUID primary key
- `player_id` - References players(id) - Player who will receive the notification
- `type` - VARCHAR(50) - Type of notification (e.g., 'connection_request', 'match_event')
- `title` - VARCHAR(255) - Notification title
- `message` - TEXT - Notification message
- `data` - JSONB - Additional data related to the notification
- `read` - BOOLEAN - Whether the notification has been read
- `created_at` - Timestamp when notification was created

### Indexes
- Performance indexes on player_id, status, and created_at fields
- Unique constraint on player_connections to prevent duplicate requests

## API Endpoints

All endpoints require authentication via the `authenticateToken` middleware.

### Connection Management

#### 1. Send Connection Request
**POST** `/api/players/connections/request`

**Request Body:**
```json
{
  "connectedPlayerId": "uuid-of-target-player"
}
```

**Response:**
```json
{
  "connection": {
    "id": "connection-uuid",
    "playerId": "requester-uuid",
    "connectedPlayerId": "target-uuid",
    "status": "pending",
    "requestedAt": "2024-01-01T10:00:00Z"
  },
  "message": "Connection request sent successfully"
}
```

**Error Cases:**
- 400: Invalid player ID format
- 400: Cannot connect to yourself
- 400: Connection request already exists
- 404: Target player not found

#### 2. Accept Connection Request
**POST** `/api/players/connections/accept/:id`

**Response:**
```json
{
  "connection": {
    "id": "connection-uuid",
    "playerId": "requester-uuid",
    "connectedPlayerId": "accepter-uuid",
    "status": "accepted",
    "requestedAt": "2024-01-01T10:00:00Z",
    "respondedAt": "2024-01-01T10:30:00Z"
  },
  "message": "Connection request accepted successfully"
}
```

#### 3. Reject Connection Request
**POST** `/api/players/connections/reject/:id`

**Response:** Similar to accept, but with status "rejected"

#### 4. Get Player Connections
**GET** `/api/players/connections`

**Response:**
```json
{
  "connections": [
    {
      "id": "connection-uuid",
      "playerId": "player1-uuid",
      "connectedPlayerId": "player2-uuid",
      "status": "accepted",
      "requestedAt": "2024-01-01T10:00:00Z",
      "respondedAt": "2024-01-01T10:30:00Z",
      "connectedPlayer": {
        "id": "player2-uuid",
        "name": "John Doe",
        "position": "MID",
        "avatarUrl": "...",
        "bio": "...",
        "location": "..."
      }
    }
  ]
}
```

#### 5. Get Pending Connection Requests
**GET** `/api/players/connections/pending`

**Response:** Returns pending requests where current player is the recipient

#### 6. Get Connection Summary
**GET** `/api/players/connections/summary`

**Response:**
```json
{
  "summary": {
    "totalConnections": 15,
    "pendingRequests": 3,
    "sentRequests": 2
  }
}
```

#### 7. Remove Connection
**DELETE** `/api/players/connections/:id`

**Response:**
```json
{
  "message": "Connection removed successfully"
}
```

### Notification Management

#### 1. Get Player Notifications
**GET** `/api/players/notifications?limit=50`

**Response:**
```json
{
  "notifications": [
    {
      "id": "notification-uuid",
      "playerId": "player-uuid",
      "type": "connection_request",
      "title": "New Connection Request",
      "message": "John Doe wants to connect with you",
      "data": {
        "requesterId": "requester-uuid"
      },
      "read": false,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

#### 2. Mark Notification as Read
**POST** `/api/players/notifications/:id/read`

#### 3. Mark All Notifications as Read
**POST** `/api/players/notifications/read-all`

#### 4. Delete Notification
**DELETE** `/api/players/notifications/:id`

## Notification Types

### 1. Connection Request (`connection_request`)
- Triggered when someone sends a connection request
- Data contains: `{ requesterId: "uuid" }`

### 2. Connection Accepted (`connection_accepted`)
- Triggered when someone accepts your connection request
- Data contains: `{ accepterId: "uuid" }`

### 3. Match Events (`match_event`)
- Triggered for goals, cards, substitutions, assists
- Data contains: `{ matchId, eventType, playerId, teamId, minute, eventId }`
- Sent to all players in the match except the event creator

## Features Implemented

### Edge Case Handling
1. **Duplicate Requests**: Prevents sending multiple requests to the same player
2. **Self-Connection**: Prevents players from connecting to themselves
3. **Rejected Request Cooldown**: 1-hour wait period before sending another request after rejection
4. **Bidirectional Connections**: Checks for existing connections in both directions
5. **Player Validation**: Ensures both players exist before creating connections

### Security Features
1. **UUID Validation**: Validates player ID format before processing
2. **Ownership Verification**: Users can only manage their own connections and notifications
3. **Authentication**: All endpoints require valid authentication tokens
4. **Transaction Safety**: Database transactions prevent race conditions in event creation

### Performance Optimizations
1. **Database Indexes**: Optimized queries with proper indexing
2. **Batch Operations**: Efficient notification creation for match events
3. **Connection Cleanup**: Automatic cleanup of old rejected connections
4. **Notification Cleanup**: Helper method to remove notifications older than 30 days

## Usage Examples

### Frontend Integration

```typescript
// Send connection request
const sendConnectionRequest = async (targetPlayerId: string) => {
  const response = await fetch('/api/players/connections/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ connectedPlayerId: targetPlayerId })
  });
  return response.json();
};

// Get notifications with unread count
const getNotifications = async () => {
  const response = await fetch('/api/players/notifications', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Accept connection request
const acceptConnection = async (connectionId: string) => {
  const response = await fetch(`/api/players/connections/accept/${connectionId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## Testing

The system has been implemented with:
- TypeScript compilation checks passed
- Comprehensive error handling
- Database schema validation
- Proper authentication middleware
- Transaction safety for critical operations

## Future Enhancements

Potential improvements that could be added:
1. Real-time notifications via WebSocket/SSE
2. Notification preferences (email, push, etc.)
3. Connection blocking/unblocking functionality
4. Group connections or friend lists
5. Connection recommendations based on mutual friends or teams
6. Integration with match invitations system

This completes the friends/connections system with notifications for the football app.