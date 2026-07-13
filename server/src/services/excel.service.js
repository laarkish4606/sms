import ExcelJS from 'exceljs';

/**
 * Streams a single-sheet workbook to the response.
 * columns: [{ header, key, width }], rows: array of plain objects keyed by `key`.
 */
export async function streamExcel(res, filename, sheetName, columns, rows) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  await workbook.xlsx.write(res);
  res.end();
}

export default { streamExcel };
