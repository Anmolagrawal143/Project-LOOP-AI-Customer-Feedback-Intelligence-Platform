/**
 * Parses a simple CSV string into row objects using the header row as keys.
 * Expects columns: content, channel, sentiment, status (optional).
 */
export function parseFeedbackCsv(csvText: string): Record<string, string>[] {
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
  });
}
