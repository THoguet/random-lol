# Multiplayer Functionality

## Overview

The application now supports online multiplayer mode where multiple players can join a room and collaborate on champion selection in real-time.

## Features

### Room Management
- **Create Room**: Create a new room and get a 6-character room code
- **Join Room**: Join an existing room using a room code
- **Leave Room**: Exit the current room
- **Auto-delete**: Rooms are automatically deleted when empty or when the owner leaves

### Real-time Synchronization
- Lane assignments synchronized across all players
- Lane enable/disable state synced
- Reroll bank shared among all players
- Player list updates in real-time

### Server Architecture
- WebSocket server using Socket.io
- Server-side state management and validation
- Server-side reroll computation for fairness
- Room isolation - each room has independent state

## How to Use

1. **Start Multiplayer Mode**
   - Click the "Multiplayer" button in the control header
   - Choose to either "Create Room" or "Join Room"

2. **Create a Room**
   - Enter your name
   - Click "Create Room"
   - Share the room code with friends

3. **Join a Room**
   - Enter your name
   - Enter the room code provided by your friend
   - Click "Join Room"

4. **Playing Together**
   - All players see the same champion assignments
   - Any player can reroll lanes
   - Lane toggles affect all players
   - Reroll bank is shared

5. **Leave Room**
   - Click "Leave Room" button to exit multiplayer mode
   - Returns to single-player mode

## Technical Details

### Client-Side
- **MultiplayerService**: Manages WebSocket connection and room state
- **RandomizerStateService**: Enhanced to support both single and multiplayer modes
- Uses Angular signals for reactive state management

### Server-Side
- **MultiplayerServer**: Handles WebSocket connections and events
- **RoomManager**: Manages room state and player operations
- Express server with Socket.io integration

### Communication Protocol
- Client-to-Server events:
  - `createRoom`
  - `joinRoom`
  - `leaveRoom`
  - `selectLane`
  - `toggleLane`
  - `rerollLane`
  - `rollAllAssignments`

- Server-to-Client events:
  - `roomState` - full state synchronization
  - `playerJoined` - notification of new player
  - `playerLeft` - notification of player leaving
  - `error` - error messages

## Testing

Tests are included for:
- Room management operations
- Multiplayer service initialization
- WebSocket event handling
- State synchronization

Run tests with:
```bash
npm test
```

## Future Enhancements

Possible improvements for future iterations:
- Player-specific lane claiming
- Room passwords/privacy settings
- Chat functionality
- Match history
- Room listing/discovery
- Reconnection handling
- Player avatars
