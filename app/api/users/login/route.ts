import { NextRequest, NextResponse } from 'next/server'

type LoginBody = {
  email?: unknown
  password?: unknown
}

type ExternalUser = {
  id: string
  email: string
  name: string
  phoneNumber: string | null
  role: 'CLIENT' | 'ADMIN' | 'SUPERADMIN' | 'STAFF'
  companyId: string | null
  passwordVerified: boolean
}

// Map external roles to internal roles
function mapExternalRoleToInternal(externalRole: ExternalUser['role']): 'ADMIN' | 'MANAGER' | 'USER' | null {
  const roleMap: Record<ExternalUser['role'], 'ADMIN' | 'MANAGER' | 'USER' | null> = {
    'CLIENT': null, // CLIENT is not allowed - revoke access
    'SUPERADMIN': 'ADMIN',
    'ADMIN': 'MANAGER',
    'STAFF': 'USER',
  }
  return roleMap[externalRole]
}

export async function POST(request: NextRequest): Promise<Response> {
  const invalidCredentialsMessage = 'Invalid email or password'
  const traceId = `login_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const externalApiUrl = process.env.EXTERNAL_AUTH_API_URL
  const bmsSecretKey = process.env.BMS_SECRET_KEY
  const imsSecretKey = process.env.IMS_SECRET_KEY
  console.log('[Login API] Incoming login request', {
    traceId,
    method: request.method,
    path: request.nextUrl.pathname,
  })

  // Validate IMS_SECRET_KEY from request header for external requests
  const authHeader = request.headers.get('authorization')
  console.log('[Login API] Authorization header present', {
    traceId,
    hasAuthHeader: Boolean(authHeader),
  })
  
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ') ?? []
    
    if (scheme !== 'Bearer' || token !== imsSecretKey) {
      console.warn('[Login API] Unauthorized access attempt - invalid IMS_SECRET_KEY')
      return NextResponse.json(
        { success: false, error: invalidCredentialsMessage },
        { status: 401 }
      )
    }
  }

  console.log('[Login API] Environment config check', {
    traceId,
    hasExternalApiUrl: Boolean(externalApiUrl),
    hasBmsSecretKey: Boolean(bmsSecretKey),
    hasImsSecretKey: Boolean(imsSecretKey),
  })

  if (!externalApiUrl) {
    return NextResponse.json(
      { success: false, error: invalidCredentialsMessage },
      { status: 500 }
    )
  }

  if (!bmsSecretKey) {
    return NextResponse.json(
      { success: false, error: invalidCredentialsMessage },
      { status: 500 }
    )
  }

  let body: LoginBody

  try {
    body = (await request.json()) as LoginBody
  } catch {
    console.warn('[Login API] Invalid JSON payload received', { traceId })
    return NextResponse.json({ success: false, error: invalidCredentialsMessage }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  console.log('[Login API] Parsed request body', {
    traceId,
    email,
    hasPassword: Boolean(password),
  })

  if (!email || !password) {
    console.warn('[Login API] Missing email or password', {
      traceId,
      hasEmail: Boolean(email),
      hasPassword: Boolean(password),
    })
    return NextResponse.json(
      { success: false, error: invalidCredentialsMessage },
      { status: 400 }
    )
  }

  try {
    // Verify user against external system.
    console.log('[Login API] Verifying credentials against external API', {
      traceId,
      email,
      externalApiUrl,
    })
    const externalRequestStart = Date.now()

    const externalResponse = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bmsSecretKey}`,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    const externalData = await externalResponse.json()
    const externalElapsedMs = Date.now() - externalRequestStart

    console.log('[Login API] Response received from external API:', {
      traceId,
      status: externalResponse.status,
      statusText: externalResponse.statusText,
      elapsedMs: externalElapsedMs,
      data: externalData,
    })

    if (!externalResponse.ok) {
      console.warn('[Login API] Authentication failed with status', {
        traceId,
        status: externalResponse.status,
      })
      return NextResponse.json(
        { success: false, error: invalidCredentialsMessage },
        { status: externalResponse.status }
      )
    }

    // Step 2: Validate mapped role from external user data
    const externalUser: ExternalUser = externalData.user
    
    console.log('[Login API] External user data received', {
      traceId,
      email: externalUser.email,
      role: externalUser.role,
      companyId: externalUser.companyId,
      passwordVerified: externalUser.passwordVerified,
    })

    // Check if role is CLIENT (not allowed)
    if (externalUser.role === 'CLIENT') {
      console.warn('[Login API] Rejecting CLIENT role', { traceId, email })
      return NextResponse.json(
        { success: false, error: invalidCredentialsMessage },
        { status: 401 }
      )
    }

    // Map role for local system usage
    const mappedRole = mapExternalRoleToInternal(externalUser.role)
    console.log('[Login API] Mapped role for local system', {
      traceId,
      externalRole: externalUser.role,
      mappedRole,
    })

    console.log('[Login API] External verification successful', {
      traceId,
      email,
      mappedRole,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: externalUser.id,
        email: externalUser.email,
        name: externalUser.name,
        phoneNumber: externalUser.phoneNumber,
        role: mappedRole,
        emailVerified: externalUser.passwordVerified,
      },
      token: externalData.token,
      tokenType: externalData.tokenType,
      expiresAt: externalData.expiresAt,
    })
  } catch (error) {
    console.error('[Login API] Error', { traceId, error })
    return NextResponse.json(
      { success: false, error: invalidCredentialsMessage },
      { status: 503 }
    )
  }
}
