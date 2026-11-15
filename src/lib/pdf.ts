export interface PdfTableOptions {
  title: string;
  subtitle?: string;
  summary?: ReadonlyArray<readonly [string, string]>;
  headers: readonly string[];
  rows: ReadonlyArray<readonly string[]>;
  filename: string;
  numbered?: boolean;
}

const BRAND_RGB: [number, number, number] = [13, 143, 110];

// jsPDF is loaded only when someone exports, so it does not slow down normal page loads.
export async function downloadTablePdf(options: PdfTableOptions): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const headers = options.numbered ? ["S.No", ...options.headers] : options.headers.slice();
  const rows = options.numbered
    ? options.rows.map((row, i) => [String(i + 1), ...row])
    : options.rows.map((row) => row.slice());
  const doc = new jsPDF({
    orientation: headers.length > 6 ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  let y = 48;
  doc.setFontSize(16);
  doc.text(options.title, 40, y);
  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(91, 103, 121);
  if (options.subtitle) {
    doc.text(options.subtitle, 40, y);
    y += 16;
  }
  for (const [label, value] of options.summary ?? []) {
    doc.text(`${label}: ${value}`, 40, y);
    y += 14;
  }
  doc.setTextColor(15, 27, 45);

  autoTable(doc, {
    startY: y + 6,
    head: [headers],
    body: rows,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: BRAND_RGB, textColor: 255 },
    alternateRowStyles: { fillColor: [244, 246, 249] },
    margin: { left: 40, right: 40 },
  });

  doc.save(options.filename);
}
