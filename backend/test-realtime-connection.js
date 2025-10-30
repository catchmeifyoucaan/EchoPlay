/**
 * Socket.IO Realtime Connection Test
 * Tests the backend Socket.IO gateway connectivity and event handling
 */

const io = require('socket.io-client');

// Test configuration
const BACKEND_URL = 'http://localhost:3000';
const TEST_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiaWQiOiJ0ZXN0LXVzZXItMTIzIiwibmFtZSI6IlRlc3QgVXNlciIsImVtYWlsIjoidGVzdEBlY2hvcGxheS5jb20iLCJpYXQiOjE3NjE4NTA3MzUsImV4cCI6MTc2MTkzNzEzNX0.8NiJOqxl7bmBfI2MSy-LnCu_tMvuZ5sdX8bALhNua7I';
const TEST_MATCH_ID = 'test-match-' + Date.now();

console.log('🔌 Testing EchoPlay Socket.IO Connection\n');

// Create socket connection
const socket = io(`${BACKEND_URL}/realtime`, {
  transports: ['websocket'],
  reconnection: false,
  timeout: 5000,
});

let testResults = {
  connection: false,
  joinRoom: false,
  startRound: false,
  timerTick: false,
  submitReaction: false,
  disconnect: false,
};

let timerTickCount = 0;

// Connection handlers
socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  console.log(`   Socket ID: ${socket.id}\n`);
  testResults.connection = true;

  // Test 1: Join room
  console.log('📝 Test 1: Joining match room...');
  socket.emit('join_room', {
    matchId: TEST_MATCH_ID,
    userId: 'test-user-123',
    jwt: TEST_JWT,
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Event handlers
socket.on('room_state', (data) => {
  console.log('✅ Test 1 passed: Joined room successfully');
  console.log(`   Match ID: ${data.matchId}`);
  console.log(`   Participants: ${data.participants}\n`);
  testResults.joinRoom = true;

  // Test 2: Start round
  console.log('📝 Test 2: Starting debate round...');
  socket.emit('start_round', {
    matchId: TEST_MATCH_ID,
    userId: 'test-user-123',
    roundNumber: 1,
    durationSeconds: 10,
  });
});

socket.on('round_started', (data) => {
  console.log('✅ Test 2 passed: Round started successfully');
  console.log(`   Round: ${data.roundNumber}`);
  console.log(`   Duration: ${data.durationSeconds}s`);
  console.log(`   Ends at: ${new Date(data.endsAt).toLocaleTimeString()}\n`);
  testResults.startRound = true;

  console.log('📝 Test 3: Listening for timer ticks...');
});

socket.on('timer_tick', (data) => {
  timerTickCount++;

  if (timerTickCount === 1) {
    console.log('✅ Test 3 passed: Timer ticking');
    testResults.timerTick = true;
  }

  process.stdout.write(`   ⏱️  ${data.remaining}s remaining...\r`);

  // Test 4: Submit reaction after 3 ticks
  if (timerTickCount === 3 && !testResults.submitReaction) {
    console.log('\n\n📝 Test 4: Submitting reaction...');
    socket.emit('submit_reaction', {
      matchId: TEST_MATCH_ID,
      userId: 'test-user-123',
      type: 'thumbs_up',
      targetUserId: 'opponent-user-456',
    });
  }
});

socket.on('reaction_received', (data) => {
  if (!testResults.submitReaction) {
    console.log('✅ Test 4 passed: Reaction submitted');
    console.log(`   Type: ${data.type}`);
    console.log(`   From: ${data.userId}`);
    console.log(`   To: ${data.targetUserId}\n`);
    testResults.submitReaction = true;
  }
});

socket.on('round_ended', (data) => {
  console.log('\n\n✅ Round ended notification received');
  console.log(`   Match ID: ${data.matchId}\n`);

  // Test 5: Disconnect
  console.log('📝 Test 5: Disconnecting...');
  socket.disconnect();
});

socket.on('disconnect', (reason) => {
  console.log('✅ Test 5 passed: Disconnected cleanly');
  console.log(`   Reason: ${reason}\n`);
  testResults.disconnect = true;

  // Print test summary
  printSummary();
});

// Timeout handler
setTimeout(() => {
  console.log('\n\n⏰ Test timeout reached\n');
  socket.disconnect();
  printSummary();
}, 15000);

function printSummary() {
  console.log('=' .repeat(50));
  console.log('TEST SUMMARY');
  console.log('=' .repeat(50));

  const tests = [
    { name: 'Socket.IO Connection', passed: testResults.connection },
    { name: 'Join Room Event', passed: testResults.joinRoom },
    { name: 'Start Round Event', passed: testResults.startRound },
    { name: 'Timer Tick Event', passed: testResults.timerTick },
    { name: 'Submit Reaction Event', passed: testResults.submitReaction },
    { name: 'Graceful Disconnect', passed: testResults.disconnect },
  ];

  let passedCount = 0;
  tests.forEach((test, index) => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${test.name.padEnd(30)} ${status}`);
    if (test.passed) passedCount++;
  });

  console.log('=' .repeat(50));
  console.log(`Results: ${passedCount}/${tests.length} tests passed`);
  console.log('=' .repeat(50));

  const exitCode = passedCount === tests.length ? 0 : 1;
  process.exit(exitCode);
}
