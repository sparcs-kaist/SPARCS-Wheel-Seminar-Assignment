const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());

// Prisma Client
const prisma = new PrismaClient();

// Initialize database connection
async function initDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error.message);
  }
}

// root route
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Hello, World!' });
});

// Database status
app.get('/db/status', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    res.json({ status: 'success', message: 'Database connected', result });
  } catch (error) {
    console.error('Database status error:', error.message);
    res.status(503).json({ status: 'error', message: 'Database not connected' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
