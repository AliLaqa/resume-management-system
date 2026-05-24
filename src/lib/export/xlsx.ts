import ExcelJS from "exceljs";

export async function toXlsxBuffer(params: {
  sheetName: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, string | number | null | undefined>[];
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(params.sheetName);

  sheet.columns = params.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 22,
  }));

  for (const row of params.rows) {
    sheet.addRow(row);
  }

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

