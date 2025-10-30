// Simple Socket.IO test client to verify the gateway is working
// Run with: node test-socket-client.js

const io = require('socket.io-client');

// Generate a test JWT (use the JWT_SECRET from .env)
const jwt = require('jsonwebtoken');
const testToken = jwt.sign(
  { id: 'test-user-123', email: 'test@example.com' },
  'dev_jwt_secret_change_in_production_to_secure_random_string'
);

console.log('🔌 Connecting to Socket.IO server at http://localhost:3000/realtime...');

const socket = io('http://localhost:3000/realtime', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✅ Connected! Socket ID:', socket.id);

  // Test join_room event
  console.log('\n📥 Sending join_room event...');
  socket.emit('join_room', {
    matchId: 'test-match-123',
    jwt: testToken,
  });
});

socket.on('room_state', (data) => {
  console.log('📦 Received room_state:', JSON.stringify(data, null, 2));

  // Test start_round event
  console.log('\n📥 Sending start_round event...');
  socket.emit('start_round', {
    matchId: 'test-match-123',
    speakerUserId: 'test-user-123',
    durationSec: 10,
  });
});

socket.on('round_started', (data) => {
  console.log('🎤 Received round_started:', JSON.stringify(data, null, 2));
});

socket.on('timer_tick', (data) => {
  console.log('⏱️  Timer tick:', data.remaining, 'seconds remaining');
});

socket.on('round_ended', (data) => {
  console.log('🏁 Received round_ended:', JSON.stringify(data, null, 2));
  console.log('\n✅ Socket.IO test completed successfully!');
  console.log('🔌 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log('\n⏰ Test timeout reached');
  socket.disconnect();
  process.exit(0);
}, 15000);
