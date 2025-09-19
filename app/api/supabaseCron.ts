import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: Request) {
  try {
    // Create admin client to perform database request
    const supabase = createAdminClient();
    
    // Make a simple query to keep the database active
    // This queries the applications table to count total applications
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase cron error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Supabase cron job executed successfully at: ${new Date().toISOString()}. Total applications: ${count}`);
    
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
    console.error('Supabase cron job failed:', error);
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