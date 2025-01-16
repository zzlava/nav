import { SignJWT, jwtVerify } from 'jose'
import { nanoid } from 'nanoid'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function createToken(username: string) {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(nanoid())
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(JWT_SECRET))

  return token
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    )
    return payload
  } catch (error) {
    throw new Error('Invalid token')
  }
} 