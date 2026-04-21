import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  const cookie = clearAuthCookie()
  const response = Response.json({ success: true })
  response.headers.set(
    'Set-Cookie',
    `${cookie.name}=${cookie.value}; HttpOnly; SameSite=Strict; Max-Age=0; Path=/`
  )
  return response
}
