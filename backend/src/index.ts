import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { showRoutes } from 'hono/dev';
import PocketBase from 'pocketbase';
import { LoginRequest, SignupRequest, ApplicationForm } from './types'; // Import the LoginRequest type

const app = new Hono();

// Use CORS middleware with restricted origins
app.use('*', cors({
  origin: ['https://applitrack-v2.pages.dev', 'https://www.applitrack.no'], // Allowed origins
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Allowed methods
  allowHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));

// Auth
app.post('/signup', async (c) => {
  const pb = new PocketBase('https://applitrack.pockethost.io');
  const { email, password, passwordConfirm }: SignupRequest = await c.req.json();

  // Validate the request body
  if (!email || !password || !passwordConfirm) {
    console.error('Validation error: Missing required fields');
    return c.json({ error: 'Validation error: Missing required fields' }, 400);
  }

  try {
    await pb.collection('users').create({ email, password, passwordConfirm });

    // Sign in the user to get the JWT token
    const authData = await pb.collection('users').authWithPassword(email, password);
    
    return c.json({ message: 'Signup successful', authData, token: authData.token }, 200);
  } catch (error) {
    console.error('PocketBase error:', error);
    return c.json({ error: 'Signup failed: ' + error }, 400);
  }
});
// Auth
app.post('/login', async (c) => {
  const pb = new PocketBase('https://applitrack.pockethost.io');
  
  const { email, password }: LoginRequest = await c.req.json();

  // Validate the request body
  if (!email || !password) {
    console.error('Validation error: Missing required fields');
    return c.json({ error: 'Validation error: Missing required fields' }, 400);
  }

  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return c.json({ authData }, 200);
  } catch (error) {
    return c.json({ error: 'Email or password incorrect' }, 400);
  }
});

// Auth
app.post('/forgot-password', async (c) => {
  const pb = new PocketBase('https://applitrack.pockethost.io');
  const { email }: { email: string } = await c.req.json();

  // Validate the request body
  if (!email) {
    console.error('Validation error: Missing required fields');
    return c.json({ error: 'Validation error: Missing required fields' }, 400);
  }

  await pb.collection('users').requestPasswordReset(email);
  return c.json({ message: 'If this email exists in our system, you will receive a password reset link shortly.' }, 200);
});

// Auth
app.post('/reset-password', async (c) => {
  const pb = new PocketBase('https://applitrack.pockethost.io');
  const { token, password, passwordConfirm } = await c.req.json();

  // Validate the request body
  if (!token || !password || !passwordConfirm) {
    console.error('Validation error: Missing required fields');
    return c.json({ error: 'Validation error: Missing required fields' }, 400);
  }

  try {
    await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm);
    return c.json({ message: 'Password reset successful' }, 200);
  } catch (error) {
    console.log(error)
    return c.json({ error: 'Password reset failed. Invalid or expired token' }, 400);
  }
});

// Auth
app.delete('/delete-account', async (c) => {
  const pb = new PocketBase('https://applitrack.pockethost.io');
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.substring(7);

  try {
    const { id } = await c.req.json(); // Extract user.id from the request body
    pb.authStore.save(token, null); // Save the token to the auth store
    await pb.collection('users').delete(id); // Pass the id to the delete method
    return c.json({ message: 'Account deleted' }, 200);
  } catch (error) {
    return c.json({ error: 'Failed to delete account' }, 400);
  }
});

// Create job application
app.post('/createJobApplication', async (c) => {
  const pb = new PocketBase('https://applitrack.pockethost.io');
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.substring(7);

  try {
    pb.authStore.save(token, null); // Save the token to the auth store
    const postData: ApplicationForm = await c.req.json();
    const post = await pb.collection('job_applications').create(postData);
    return c.json({ post }, 200);
  } catch (error) {
    return c.json({ error }, 400);
  }
});

// Get job applications
app.get('/jobs', async (c) => {
  const pb = new PocketBase('https://applitrack.pockethost.io');

  // Extract the JWT token from the Authorization header
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Authenticate using the token
  try {
    pb.authStore.save(token, null); // Save the token to the auth store    
    const job_applications = await pb.collection('job_applications').getFullList();
    return c.json(job_applications, 200);
  } catch (error) {
    return c.json({ error: 'Failed to fetch posts' }, 400);
  }
});

// Update a job application
app.patch('/job_applications/:id', async (c) => {
  const pb = new PocketBase('https://applitrack.pockethost.io');

  // Extract the JWT token from the Authorization header
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Authenticate using the token
  try {
    pb.authStore.save(token, null); // Save the token to the auth store
    const { id } = c.req.param();
    const { status } = await c.req.json();
    const job_application = await pb.collection('job_applications').update(id, { status });
    return c.json(job_application, 200);
  } catch (error) {
    return c.json({ error: 'Failed to update job application' }, 400);
  }
});

// Delete a job application
app.delete('/job_applications/:id', async (c) => {
  const pb = new PocketBase('https://applitrack.pockethost.io');

  // Extract the JWT token from the Authorization header
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Authenticate using the token
  try {
    pb.authStore.save(token, null); // Save the token to the auth store
    const { id } = c.req.param();
    const job_application = await pb.collection('job_applications').delete(id);
    return c.json(job_application, 200);
  } catch (error) {
    return c.json({ error: 'Failed to delete job application' }, 400);
  }
});

showRoutes(app);

export default app;