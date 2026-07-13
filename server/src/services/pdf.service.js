import PDFDocument from 'pdfkit';

/**
 * Streams a PDFDocument straight to the HTTP response. Callers provide a
 * `draw(doc)` function that lays out content; this handles headers + piping.
 */
export function streamPdf(res, filename, draw) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  draw(doc);
  doc.end();
}

export function drawReceipt(doc, { school, payment, invoice, student }) {
  doc.fontSize(18).text(school.name, { align: 'center' });
  doc.fontSize(10).text(school.address || '', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text('Payment Receipt', { align: 'center', underline: true });
  doc.moveDown();

  doc.fontSize(11);
  doc.text(`Receipt No: ${payment.receiptNumber}`);
  doc.text(`Date: ${new Date(payment.paidAt).toLocaleDateString()}`);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`);
  doc.moveDown(0.5);
  doc.text(`Student: ${student.firstName} ${student.lastName} (${student.admissionNumber})`);
  doc.moveDown();

  doc.text(`Amount Paid: ${payment.amount.toFixed(2)}`);
  doc.text(`Payment Method: ${payment.method.replace('_', ' ')}`);
  if (payment.transactionRef) doc.text(`Transaction Ref: ${payment.transactionRef}`);
  doc.moveDown();
  doc.text(`Invoice Total: ${invoice.totalAmount.toFixed(2)}`);
  doc.text(`Amount Paid to Date: ${invoice.amountPaid.toFixed(2)}`);
  doc.text(`Balance Due: ${Math.max(invoice.totalAmount - invoice.amountPaid, 0).toFixed(2)}`);
  doc.moveDown(2);
  doc.text('Thank you.', { align: 'center' });
}

export function drawReportCard(doc, { school, exam, student, reportCard }) {
  doc.fontSize(18).text(school.name, { align: 'center' });
  doc.fontSize(14).text('Student Report Card', { align: 'center', underline: true });
  doc.moveDown();

  doc.fontSize(11);
  doc.text(`Exam: ${exam.name}`);
  doc.text(`Student: ${student.firstName} ${student.lastName} (${student.admissionNumber})`);
  doc.moveDown();

  const tableTop = doc.y;
  doc.font('Helvetica-Bold');
  doc.text('Subject', 50, tableTop);
  doc.text('Obtained', 250, tableTop);
  doc.text('Max', 330, tableTop);
  doc.text('Grade', 410, tableTop);
  doc.font('Helvetica');

  let y = tableTop + 20;
  reportCard.subjects.forEach((s) => {
    doc.text(s.subject, 50, y);
    doc.text(String(s.obtained), 250, y);
    doc.text(String(s.total), 330, y);
    doc.text(s.grade, 410, y);
    y += 18;
  });

  doc.moveDown(3);
  doc.font('Helvetica-Bold');
  doc.text(`Total: ${reportCard.totalObtained}/${reportCard.totalMax}`);
  doc.text(`Percentage: ${reportCard.percentage}%`);
  doc.text(`Grade: ${reportCard.grade}  |  GPA: ${reportCard.gpa}`);
  doc.text(`Result: ${reportCard.result}`);
}

export default { streamPdf, drawReceipt, drawReportCard };
