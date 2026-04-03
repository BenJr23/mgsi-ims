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
  const externalApiUrl = process.env.EXTERNAL_AUTH_API_URL
  const bmsSecretKey = process.env.BMS_SECRET_KEY
  const imsSecretKey = process.env.IMS_SECRET_KEY

  // Validate IMS_SECRET_KEY from request header for external requests
  const authHeader = request.headers.get('authorization')
  
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ') ?? []
    
    if (scheme !== 'Bearer' || token !== imsSecretKey) {
      return NextResponse.json(
        { success: false, error: invalidCredentialsMessage },
        { status: 401 }
      )
    }
  }

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
    return NextResponse.json({ success: false, error: invalidCredentialsMessage }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: invalidCredentialsMessage },
      { status: 400 }
    )
  }

  try {
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

    if (!externalResponse.ok) {
      return NextResponse.json(
        { success: false, error: invalidCredentialsMessage },
        { status: externalResponse.status }
      )
    }

    // Step 2: Validate mapped role from external user data
    const externalUser: ExternalUser = externalData.user

    // Check if role is CLIENT (not allowed)
    if (externalUser.role === 'CLIENT') {
      return NextResponse.json(
        { success: false, error: invalidCredentialsMessage },
        { status: 401 }
      )
    }

    // Map role for local system usage
    const mappedRole = mapExternalRoleToInternal(externalUser.role)

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
  } catch {
    return NextResponse.json(
      { success: false, error: invalidCredentialsMessage },
      { status: 503 }
    )
  }
}
