// Quick script to check if backend server is running
const http = require('http');

const PORT = process.env.PORT || 3001;
const HOST = 'localhost';

console.log(`Checking if backend server is running on http://${HOST}:${PORT}...\n`);

const options = {
  hostname: HOST,
  port: PORT,
  path: '/api/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  console.log(`✅ Server is RUNNING!`);
  console.log(`   Status Code: ${res.statusCode}`);
  console.log(`   URL: http://${HOST}:${PORT}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`   Response: ${data}`);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.log(`❌ Server is NOT running or not accessible!`);
  console.log(`   Error: ${error.message}`);
  console.log(`\n   Please start the server with:`);
  console.log(`   cd server`);
  console.log(`   node server.js`);
  console.log(`\n   Or with nodemon for auto-reload:`);
  console.log(`   cd server`);
  console.log(`   npm run dev`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log(`❌ Connection timeout!`);
  console.log(`   Server might be running but not responding.`);
  req.destroy();
  process.exit(1);
});

req.end();

