const express = require('express');
const client = require('prom-client');
const path = require('path');
const app = express();
const port = 3000;

// Enable Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const requestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
const responseTime = new client.Histogram({
  name: 'http_response_time_seconds',
  help: 'HTTP response time in seconds',
  buckets: [0.1, 0.5, 1, 2, 5]
});
const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of active users'
});
const errorCounter = new client.Counter({
  name: 'error_rate',
  help: 'Number of failed requests'
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Simulate active users (random for demo)
setInterval(() => {
  activeUsers.set(Math.floor(Math.random() * 100)); // Random 0–100 users
}, 5000);

// API endpoint
app.get('/api', (req, res) => {
  const end = responseTime.startTimer();
  requestCounter.inc({ method: 'GET', route: '/api', status: 200 });

  // Simulate occasional errors (10% chance)
  if (Math.random() < 0.1) {
    errorCounter.inc();
    res.status(500).json({ error: 'Simulated server error' });
  } else {
    res.json({ message: 'Realtime API response', timestamp: new Date() });
  }
  end(); // Record response time
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});