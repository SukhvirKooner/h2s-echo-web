import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadBlob, toCsv } from './format';

export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  downloadBlob(filename, toCsv(rows), 'text/csv;charset=utf-8');
}

export function exportPdf(
  filename: string,
  title: string,
  subtitle: string,
  columns: string[],
  rows: (string | number)[][],
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('H2S-ECHO', 14, 16);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 24);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(subtitle, 14, 30);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 36,
    head: [columns],
    body: rows,
    styles: { fontSize: 8, font: 'courier' },
    headStyles: { fillColor: [37, 116, 101] },
  });

  doc.save(filename);
}
