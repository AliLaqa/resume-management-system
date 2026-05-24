function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => escapeCsvValue(cell ?? "")).join(","))
    .join("\r\n");
}

