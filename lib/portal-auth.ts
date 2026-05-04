const encoder = new TextEncoder()

export async function createPortalToken(password: string, secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${password}:${secret}`))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export function isSafePortalRedirect(value: string | null) {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/portal"))
}
