export async function csrfMiddleware(request: Request, env: any): Promise<Response | null> {
  return null
}

export function getCSRFTokenFromRequest(request: Request): string | null {
  return null
}

export async function createCSRFToken(env: any, sessionId: string, ttlSeconds?: number): Promise<string | null> {
  return null
}

export function getCSRFSessionId(request: Request): string {
  return ''
}
