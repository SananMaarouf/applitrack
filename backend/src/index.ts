import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Use CORS middleware
app.use('*', cors());

app.get('/', (c) => {
  return c.text('Hello World');
});

app.get('/json', (c) => {
  return c.json({ message: 'Hello World' });
});

export default app;