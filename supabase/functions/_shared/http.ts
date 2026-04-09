import { createClient } from 'npm:@supabase/supabase-js@2'

export class RequestError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...init.headers,
    },
  })
}

export function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  )
}

export function handleCors(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return null
}

export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

function createUserClient(request: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const authorization = request.headers.get('Authorization')

  if (!authorization) {
    throw new RequestError(401, 'missing_authorization', 'Missing Authorization header.')
  }

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  })
}

export async function requireAdminUser(request: Request) {
  const client = createUserClient(request)
  const { data, error } = await client.auth.getUser()

  if (error || !data.user) {
    throw new RequestError(401, 'invalid_session', 'Unable to verify the current session.')
  }

  if (data.user.app_metadata?.role !== 'admin') {
    throw new RequestError(403, 'admin_required', 'Admin privileges are required.')
  }

  return data.user
}
