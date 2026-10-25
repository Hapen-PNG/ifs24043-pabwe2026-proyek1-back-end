export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
  }
}

export function parsePositiveId(value, fieldName = 'id') {
  if (!/^[1-9]\d*$/.test(String(value ?? ''))) {
    throw new HttpError(400, `${fieldName} harus berupa bilangan bulat positif.`)
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) {
    throw new HttpError(400, `${fieldName} tidak valid.`)
  }
  return parsed
}

export function parseText(value, fieldName, maxLength) {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${fieldName} wajib berupa teks.`)
  }
  const text = value.trim()
  if (!text) throw new HttpError(400, `${fieldName} wajib diisi.`)
  if (text.length > maxLength) {
    throw new HttpError(400, `${fieldName} maksimal ${maxLength} karakter.`)
  }
  return text
}

export function sendSuccess(res, message, data = {}) {
  return res.json({ status: 'success', message, data })
}
