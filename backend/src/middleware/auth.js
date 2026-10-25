const TOKEN_CACHE_TTL_MS = 60_000
const tokenCache = new Map()

function removeExpiredEntries(now) {
  for (const [token, entry] of tokenCache) {
    if (entry.expiresAt <= now) tokenCache.delete(token)
  }
}

function getBearerToken(header) {
  const match = /^Bearer\s+(.+)$/i.exec(header ?? '')
  return match?.[1]?.trim() || null
}

async function verifyToken(token) {
  const baseUrl = process.env.DELCOM_BASEURL?.replace(/\/+$/, '')
  if (!baseUrl) {
    const error = new Error('DELCOM_BASEURL belum dikonfigurasi')
    error.statusCode = 500
    throw error
  }

  const response = await fetch(`${baseUrl}/users/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  let payload
  try {
    payload = await response.json()
  } catch {
    return null
  }

  const user = payload?.data?.user
  if (!response.ok || payload?.status !== 'success' || !user?.id) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

export default async function authenticate(req, res, next) {
  const token = getBearerToken(req.get('Authorization'))
  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token tidak valid',
      data: {},
    })
  }

  const now = Date.now()
  removeExpiredEntries(now)
  const cachedUser = tokenCache.get(token)
  if (cachedUser && cachedUser.expiresAt > now) {
    req.user = cachedUser.user
    return next()
  }

  try {
    const user = await verifyToken(token)
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Token tidak valid',
        data: {},
      })
    }

    tokenCache.set(token, {
      user,
      expiresAt: Date.now() + TOKEN_CACHE_TTL_MS,
    })
    req.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}
