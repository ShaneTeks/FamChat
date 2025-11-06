// Helper to get authorization headers for API calls
import { supabase } from './supabase'

export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    return {}
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`
  }
}
