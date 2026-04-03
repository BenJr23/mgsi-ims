import { NextResponse } from 'next/server'

type LoginBody = {
  email?: unknown
  password?: unknown
}

function getRequestBodyEmailAndPassword(body: LoginBody): { email: string; password: string } | null {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
        return null
    }

    return { email, password }
}

function buildUnauthorizedResponse(): NextResponse {
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
}

export async function POST(request: Request): Promise<Response> {
    const EXTERNAL_LOGIN_ENDPOINT = process.env.EXTERNAL_LOGIN_ENDPOINT
    const BMS_SECRET_KEY = process.env.BMS_SECRET_KEY

    if (!EXTERNAL_LOGIN_ENDPOINT) {
        return NextResponse.json(
            { success: false, error: 'EXTERNAL_LOGIN_ENDPOINT is not configured' },
            { status: 500 }
        )
    }

    if (!BMS_SECRET_KEY) {
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

    const credentials = getRequestBodyEmailAndPassword(body)

    if (!credentials) {
        return NextResponse.json(
            { success: false, error: 'Email and password are required' },
            { status: 400 }
        )
    }

    try {
        const externalResponse = await fetch(EXTERNAL_LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bms-secret': BMS_SECRET_KEY,
            },
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
            }),
        })

        if (!externalResponse.ok) {
            return buildUnauthorizedResponse()
        }

        const externalData = await externalResponse.json()

        // Pass through the response from external system
        const response = NextResponse.json(externalData)
        response.headers.set('Cache-Control', 'no-store')

        return response
    } catch (error) {
        console.error('External login endpoint error:', error)
        return NextResponse.json(
            { success: false, error: 'Error communicating with authentication service' },
            { status: 500 }
        )
    }
}
