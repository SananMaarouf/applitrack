import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { showRoutes } from 'hono/dev';
import { decode, sign, verify } from 'hono/jwt'

const app = new Hono();

// Use CORS middleware with restricted origins
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://www.applitrack.no'], // Allowed origins
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  allowHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));

app.get('/', (c) => {
  return c.text('Hello World');
});

app.get('/json', (c) => {
  return c.json({ message: 'Hello World' });
});

// Intentionally return an error for testing
app.get('/error', (c) => {
  return c.json({ error: 'Intentional error' }, 500);
});

showRoutes(app);

export default app; 