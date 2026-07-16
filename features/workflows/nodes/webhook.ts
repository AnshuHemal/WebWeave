export async function webhook({
  url,
  method,
  headers,
  body,
}: {
  url: string
  method: string
  headers?: string
  body?: string
}) {
  const parsedHeaders = headers ? JSON.parse(headers) : {}
  let payloadBody: string | undefined = undefined

  if (body) {
    try {
      // Validate/format if body is valid JSON
      payloadBody = JSON.stringify(JSON.parse(body))
    } catch {
      payloadBody = body
    }
  }

  const response = await fetch(url, {
    method: method || "POST",
    headers: {
      "Content-Type": "application/json",
      ...parsedHeaders,
    },
    body: payloadBody,
  })

  let textResponse = ""
  try {
    textResponse = await response.text()
  } catch {
    // ignore
  }

  return {
    status: response.status,
    response: textResponse,
  }
}
