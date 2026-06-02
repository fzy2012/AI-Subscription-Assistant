import { createSign } from 'node:crypto'

const DEFAULT_VERTEX_API_BASE_URL = 'https://aiplatform.googleapis.com/v1'
const DEFAULT_VERTEX_LOCATION = 'global'
const DEFAULT_VERTEX_MODEL = 'gemini-2.5-flash-lite'
const GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token'
const VERTEX_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'

let cachedToken = null

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function parseCredentials(raw) {
  if (!raw || !raw.trim()) return null

  const candidates = [
    raw.trim(),
    Buffer.from(raw.trim(), 'base64').toString('utf8'),
  ]

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
      return parsed
    } catch {
      // Try the next representation.
    }
  }

  throw new Error('Vertex AI service account JSON is invalid.')
}

function assertVertexMode() {
  const useVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI
  if (useVertex !== undefined && useVertex.toLowerCase() !== 'true') {
    throw new Error('Vertex AI is enforced: GOOGLE_GENAI_USE_VERTEXAI must be True/true when set.')
  }
}

function getCredentials() {
  return parseCredentials(
    process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    ''
  )
}

function createServiceAccountJwt(credentials) {
  const now = Math.floor(Date.now() / 1000)
  const tokenUri = credentials.token_uri || GOOGLE_TOKEN_URI
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: credentials.client_email,
    scope: VERTEX_SCOPE,
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  }
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`
  const signer = createSign('RSA-SHA256')
  signer.update(signingInput)
  signer.end()
  return `${signingInput}.${base64Url(signer.sign(credentials.private_key))}`
}

async function getVertexAccessToken() {
  assertVertexMode()

  const explicitToken = process.env.GOOGLE_VERTEX_ACCESS_TOKEN?.trim()
  if (explicitToken) return explicitToken

  const credentials = getCredentials()
  if (!credentials?.client_email || !credentials.private_key) {
    throw new Error('Vertex AI service account is not configured.')
  }

  const tokenUri = credentials.token_uri || GOOGLE_TOKEN_URI
  const cacheKey = `${credentials.client_email}:${credentials.private_key.slice(-32)}:${tokenUri}`
  if (cachedToken && cachedToken.cacheKey === cacheKey && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken
  }

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createServiceAccountJwt(credentials),
    }),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || `Vertex token request failed with status ${response.status}`)
  }

  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(60, payload.expires_in || 3600) * 1000,
    cacheKey,
  }
  return cachedToken.accessToken
}

function getVertexUrl() {
  const project = process.env.GOOGLE_CLOUD_PROJECT?.trim()
  if (!project) throw new Error('GOOGLE_CLOUD_PROJECT is required for Vertex AI.')

  const location = process.env.GOOGLE_CLOUD_LOCATION?.trim() || DEFAULT_VERTEX_LOCATION
  const model = process.env.VERTEX_AI_MODEL?.trim() || DEFAULT_VERTEX_MODEL
  const baseUrl = (process.env.VERTEX_AI_API_BASE_URL || DEFAULT_VERTEX_API_BASE_URL).replace(/\/+$/, '')

  return `${baseUrl}/projects/${encodeURIComponent(project)}/locations/${encodeURIComponent(location)}/publishers/google/models/${encodeURIComponent(model)}:generateContent`
}

function extractText(payload) {
  return (payload.candidates?.[0]?.content?.parts || [])
    .map((part) => typeof part.text === 'string' ? part.text : '')
    .join('')
    .trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const { prompt, systemInstruction, responseSchema } = body
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'prompt is required' })
      return
    }

    const accessToken = await getVertexAccessToken()
    const response = await fetch(getVertexUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        generationConfig: responseSchema
          ? { responseMimeType: 'application/json', responseSchema }
          : undefined,
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      res.status(response.status).json({
        error: payload.error?.message || `Vertex AI request failed with status ${response.status}`,
      })
      return
    }

    const text = extractText(payload)
    if (!text) {
      res.status(502).json({ error: 'Vertex AI response missing text' })
      return
    }

    res.status(200).json({ text })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
  }
}
