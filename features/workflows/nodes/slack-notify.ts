export async function slackNotify({
  webhookUrl,
  text,
}: {
  webhookUrl: string
  text: string
}) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })

  return {
    sent: response.ok,
  }
}
