import { NextRequest, NextResponse } from 'next/server'

type LoginBody = {
  email?: unknown
  password?: unknown
}

export async function POST(request: NextRequest): Promise<Response> {
  const externalApiUrl = process.env.EXTERNAL_AUTH_API_URL
  const bmsSecretKey = process.env.BMS_SECRET_KEY

  if (!externalApiUrl) {
    return NextResponse.json(
      { success: false, error: 'EXTERNAL_AUTH_API_URL is not configured' },
      { status: 500 }
    )
  }

  if (!bmsSecretKey) {
    return NextResponse.json(
      { success: false, error: 'BMS_SECRET_KEY is not configured' },
      { status: 500 }
    )
  }

  let body: LoginBody

  try {
    body = (await request.json()) as LoginBody
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: 'Email and password are required' },
      { status: 400 }
    )
  }

  try {
    console.log('[Login API] Sending request to external auth API:', {
      url: externalApiUrl,
      email,
    })

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

    const data = await externalResponse.json()

    console.log('[Login API] Response received from external API:', {
      status: externalResponse.status,
      statusText: externalResponse.statusText,
      data,
    })

    if (!externalResponse.ok) {
      console.warn('[Login API] Authentication failed with status:', externalResponse.status)
      return NextResponse.json(
        { success: false, error: data.error || 'Authentication failed' },
        { status: externalResponse.status }
      )
    }

    console.log('[Login API] Authentication successful for:', email)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Login API] External auth API error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication service unavailable' },
      { status: 503 }
    )
  }
}
