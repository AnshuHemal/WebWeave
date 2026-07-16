/**
 * http-request node executor
 *
 * A full-featured REST client node. Supports:
 * - All HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD)
 * - Authentication: Bearer token, API Key (header/query), Basic Auth
 * - Custom headers (JSON object)
 * - Query parameters (JSON object)
 * - JSON / form / raw body
 * - Configurable timeout
 *
 * Returns: { status, ok, body, headers }
 */

export type HttpRequestValues = {
  url: string
  method?: string
  authType?: "none" | "bearer" | "apikey-header" | "apikey-query" | "basic"
  authToken?: string
  authKeyName?: string
  authUsername?: string
  authPassword?: string
  headers?: string
  queryParams?: string
  bodyType?: "none" | "json" | "form" | "raw"
  body?: string
  timeoutMs?: string
}

export async function httpRequest(values: HttpRequestValues): Promise<{
  status: number
  ok: boolean
  body: unknown
  headers: Record<string, string>
}> {
  const {
    url,
    method = "GET",
    authType = "none",
    authToken,
    authKeyName,
    authUsername,
    authPassword,
    headers: headersJson,
    queryParams: queryParamsJson,
    bodyType = "none",
    body: bodyString,
    timeoutMs = "30000",
  } = values

  if (!url) throw new Error("HTTP Request: URL is required")

  // ------------------------------------------------------------------
  // Build URL with optional query params
  // ------------------------------------------------------------------
  let finalUrl: URL
  try {
    finalUrl = new URL(url)
  } catch {
    throw new Error(`HTTP Request: invalid URL "${url}"`)
  }

  if (queryParamsJson) {
    try {
      const params = JSON.parse(queryParamsJson) as Record<string, string>
      for (const [k, v] of Object.entries(params)) {
        finalUrl.searchParams.set(k, String(v))
      }
    } catch {
      throw new Error("HTTP Request: Query Params must be valid JSON object")
    }
  }

  // For API Key in query string auth
  if (authType === "apikey-query" && authKeyName && authToken) {
    finalUrl.searchParams.set(authKeyName, authToken)
  }

  // ------------------------------------------------------------------
  // Build headers
  // ------------------------------------------------------------------
  const requestHeaders: Record<string, string> = {}

  if (headersJson) {
    try {
      const parsed = JSON.parse(headersJson) as Record<string, string>
      Object.assign(requestHeaders, parsed)
    } catch {
      throw new Error("HTTP Request: Headers must be a valid JSON object")
    }
  }

  // Auth headers
  if (authType === "bearer" && authToken) {
    requestHeaders["Authorization"] = `Bearer ${authToken}`
  } else if (authType === "apikey-header" && authKeyName && authToken) {
    requestHeaders[authKeyName] = authToken
  } else if (authType === "basic" && authUsername && authPassword) {
    const encoded = Buffer.from(`${authUsername}:${authPassword}`).toString("base64")
    requestHeaders["Authorization"] = `Basic ${encoded}`
  }

  // ------------------------------------------------------------------
  // Build request body
  // ------------------------------------------------------------------
  let requestBody: string | undefined
  if (bodyType === "json" && bodyString) {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] ?? "application/json"
    requestBody = bodyString
  } else if (bodyType === "form" && bodyString) {
    requestHeaders["Content-Type"] =
      requestHeaders["Content-Type"] ?? "application/x-www-form-urlencoded"
    requestBody = bodyString
  } else if (bodyType === "raw" && bodyString) {
    requestBody = bodyString
  }

  // ------------------------------------------------------------------
  // Execute request with timeout
  // ------------------------------------------------------------------
  const timeout = Math.min(Number(timeoutMs) || 30000, 120000)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  let response: Response
  try {
    response = await fetch(finalUrl.toString(), {
      method: method.toUpperCase(),
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    })
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`HTTP Request: timed out after ${timeout}ms`)
    }
    throw new Error(`HTTP Request: network error — ${err?.message ?? String(err)}`)
  } finally {
    clearTimeout(timer)
  }

  // ------------------------------------------------------------------
  // Parse response
  // ------------------------------------------------------------------
  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  const contentType = response.headers.get("content-type") ?? ""
  let body: unknown
  if (contentType.includes("application/json")) {
    try {
      body = await response.json()
    } catch {
      body = await response.text()
    }
  } else {
    body = await response.text()
  }

  return {
    status: response.status,
    ok: response.ok,
    body,
    headers: responseHeaders,
  }
}
