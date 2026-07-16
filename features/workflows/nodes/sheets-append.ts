export async function sheetsAppend({
  spreadsheetId,
  range,
  values,
}: {
  spreadsheetId: string
  range: string
  values: string
}) {
  let parsedValues: any[] = []
  try {
    parsedValues = JSON.parse(values)
    if (!Array.isArray(parsedValues)) {
      parsedValues = [parsedValues]
    }
  } catch {
    parsedValues = [values]
  }

  // Simulate Google Sheets API row appending in sandbox
  return {
    updatedRange: `${range}!A${Math.floor(Math.random() * 100) + 1}`,
  }
}
