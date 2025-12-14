import { db } from '@/db';
import { applications } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Simple authentication using a secret token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error',
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron job attempt');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized',
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Make a simple query to keep the database active
    // This queries the applications table to count total applications
    const result = await db.select({ count: sql<number>`count(*)` }).from(applications);
    const count = result[0]?.count || 0;

    console.log(`Database cron job executed successfully at: ${new Date().toISOString()}. Total applications: ${count}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database ping successful',
        applicationCount: count,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Database cron job failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}