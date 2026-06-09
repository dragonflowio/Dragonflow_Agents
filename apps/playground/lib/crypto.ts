import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.CONNECTIONS_ENCRYPTION_KEY
  if (!hex) throw new Error('CONNECTIONS_ENCRYPTION_KEY is not set')
  return Buffer.from(hex, 'hex')
}

export function encrypt(text: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':')
}

export function decrypt(encryptedText: string): string {
  const [ivHex, tagHex, dataHex] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 4)}${'•'.repeat(8)}${key.slice(-4)}`
}
