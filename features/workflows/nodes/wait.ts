export async function waitNode({ seconds }: { seconds: number }) {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  return { seconds }
}
