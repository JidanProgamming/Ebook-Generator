import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from 'docx';
import JSZip from 'jszip';
import { Ebook } from '../types/index.js';

export interface ExportOptions {
  includeCover: boolean;
  includeToc: boolean;
  pageSize: 'a4' | 'digest';
  includePageNumbers: boolean;
}

// Strip HTML tags to clean plain text for line wrapping
export function stripHtml(html: string): string {
  const tmp = html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return tmp.trim();
}

// Convert HTML content into structured blocks for PDF/DOCX rendering
export interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'quote' | 'list_item';
  text: string;
}

export function parseHtmlToBlocks(html: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const regex = /<(h1|h2|h3|p|blockquote|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const rawContent = match[2];
    const text = stripHtml(rawContent);
    if (!text) continue;

    if (tag === 'h1') blocks.push({ type: 'h1', text });
    else if (tag === 'h2') blocks.push({ type: 'h2', text });
    else if (tag === 'h3') blocks.push({ type: 'h3', text });
    else if (tag === 'blockquote') blocks.push({ type: 'quote', text });
    else if (tag === 'li') blocks.push({ type: 'list_item', text: '• ' + text });
    else blocks.push({ type: 'p', text });
  }

  if (blocks.length === 0) {
    const plain = stripHtml(html);
    plain.split('\n\n').forEach((para) => {
      const clean = para.trim();
      if (clean) blocks.push({ type: 'p', text: clean });
    });
  }

  return blocks;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Convert image source to PNG data URL if needed for jsPDF rendering
async function ensurePngDataUrl(imgSrc: string): Promise<string> {
  if (imgSrc.startsWith('data:image/png') || imgSrc.startsWith('data:image/jpeg')) {
    return imgSrc;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 900;
        canvas.height = img.naturalHeight || 1200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch (e) {
        // ignore
      }
      resolve(imgSrc);
    };
    img.onerror = () => resolve(imgSrc);
    img.src = imgSrc;
  });
}

// --- 1. EXPORT TO PDF ---
export async function generatePdf(ebook: Ebook, options: ExportOptions): Promise<{ blob: Blob; size: number }> {
  // A4 dimensions: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: options.pageSize === 'digest' ? [152, 229] : 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let pageNumber = 1;

  // 1. Cover Page
  if (options.includeCover) {
    const cover = ebook.coverSettings;
    const align = cover.alignment || 'center';
    const alignOption: { align: 'center' | 'left' | 'right' } = { align };
    const textX = align === 'left' ? margin + 10 : align === 'right' ? pageWidth - margin - 10 : pageWidth / 2;

    let bgDrawn = false;
    if (cover.bgImageUrl) {
      try {
        const pngUrl = await ensurePngDataUrl(cover.bgImageUrl);
        doc.addImage(pngUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        bgDrawn = true;
      } catch (err) {
        console.warn('Failed to embed cover background image in PDF', err);
      }
    }

    if (!bgDrawn) {
      const primaryHex = cover.primaryColor || '#0f172a';
      doc.setFillColor(primaryHex);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    // Decorative inner border frame
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Tagline / Category badge (optional)
    if (cover.tagline) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      const badgeText = cover.tagline.toUpperCase();
      doc.text(badgeText, textX, 42, alignOption);

      if (align === 'center') {
        doc.setLineWidth(0.3);
        doc.line(pageWidth / 2 - 20, 48, pageWidth / 2 + 20, 48);
      }
    }

    // Title with chosen font family
    const titleFont =
      cover.fontFamily === 'serif' ? 'times' : cover.fontFamily === 'mono' ? 'courier' : 'helvetica';
    doc.setFont(titleFont, 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    const titleLines = doc.splitTextToSize(cover.title || ebook.title, contentWidth - 10);
    doc.text(titleLines, textX, 85, alignOption);

    // Subtitle (optional)
    if (cover.subtitle) {
      const subtitleY = 85 + titleLines.length * 11 + 4;
      doc.setFont(titleFont === 'courier' ? 'courier' : 'helvetica', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(240, 240, 245);
      const subLines = doc.splitTextToSize(cover.subtitle, contentWidth - 10);
      doc.text(subLines, textX, subtitleY, alignOption);
    }

    // Author
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(cover.author || 'Penulis', textX, pageHeight - 38, alignOption);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(210, 215, 230);
    doc.text('Diterbitkan Secara Digital', textX, pageHeight - 28, alignOption);

    doc.addPage();
    pageNumber++;
  }

  // 2. Title & Metadata Page
  doc.setTextColor(30, 41, 59);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text(ebook.title, margin, 40);

  if (ebook.subtitle) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(ebook.subtitle, margin, 50);
  }

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 60, pageWidth - margin, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  let metaY = 75;
  doc.text(`Penulis: ${ebook.coverSettings.author || 'Penulis'}`, margin, metaY);
  metaY += 8;
  doc.text(`Target Pembaca: ${ebook.targetAudience}`, margin, metaY);
  metaY += 8;
  doc.text(`Bahasa: ${ebook.language}`, margin, metaY);
  metaY += 8;
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, metaY);

  if (ebook.conceptSummary) {
    metaY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Tentang Ebook Ini:', margin, metaY);
    metaY += 7;
    doc.setFont('helvetica', 'normal');
    const conceptLines = doc.splitTextToSize(ebook.conceptSummary, contentWidth);
    doc.text(conceptLines, margin, metaY);
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Hak Cipta Dilindungi Undang-Undang. Dibuat dengan Ebook Generator AI.', margin, pageHeight - 20);

  // 3. Table of Contents
  if (options.includeToc && (ebook.chapters || []).length > 0) {
    doc.addPage();
    pageNumber++;

    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('Daftar Isi', margin, 35);

    doc.setLineWidth(0.5);
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, 42, pageWidth - margin, 42);

    let tocY = 55;
    (ebook.chapters || []).forEach((ch, idx) => {
      if (tocY > pageHeight - 30) {
        doc.addPage();
        pageNumber++;
        tocY = 35;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(ch.title, margin, tocY);

      if (ch.summary) {
        tocY += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        const sumLines = doc.splitTextToSize(ch.summary, contentWidth - 10);
        doc.text(sumLines, margin + 4, tocY);
        tocY += sumLines.length * 4.5 + 4;
      } else {
        tocY += 10;
      }
    });
  }

  // Helper for page numbering and running headers
  const addHeaderAndFooter = (pageNum: number) => {
    if (!options.includePageNumbers || pageNum === 1) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    // Header
    doc.text(ebook.title, margin, 12);
    doc.line(margin, 14, pageWidth - margin, 14);

    // Footer
    const pageStr = `Halaman ${pageNum}`;
    doc.text(pageStr, pageWidth - margin, pageHeight - 12, { align: 'right' });
  };

  // 4. Introduction
  if (ebook.introduction) {
    doc.addPage();
    pageNumber++;
    addHeaderAndFooter(pageNumber);

    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('Pendahuluan', margin, 30);

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const introLines = doc.splitTextToSize(stripHtml(ebook.introduction), contentWidth);

    let curY = 42;
    introLines.forEach((line: string) => {
      if (curY > pageHeight - margin - 15) {
        doc.addPage();
        pageNumber++;
        addHeaderAndFooter(pageNumber);
        curY = 25;
      }
      doc.text(line, margin, curY);
      curY += 6.5;
    });
  }

  // 5. Chapters
  const chapters = (ebook.chapters || []).sort((a, b) => a.position - b.position);

  chapters.forEach((chapter) => {
    doc.addPage();
    pageNumber++;
    addHeaderAndFooter(pageNumber);

    let curY = 30;

    // Chapter Header
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    const titleLines = doc.splitTextToSize(chapter.title, contentWidth);
    doc.text(titleLines, margin, curY);
    curY += titleLines.length * 8 + 4;

    // Chapter divider
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    doc.line(margin, curY, margin + 40, curY);
    curY += 10;

    const blocks = parseHtmlToBlocks(chapter.content || `<p>${chapter.summary}</p>`);

    blocks.forEach((block) => {
      if (block.type === 'h1' && block.text === chapter.title) return; // Skip duplicate

      if (block.type === 'h2') {
        curY += 5;
        if (curY > pageHeight - margin - 20) {
          doc.addPage();
          pageNumber++;
          addHeaderAndFooter(pageNumber);
          curY = 25;
        }
        doc.setFont('times', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        const lines = doc.splitTextToSize(block.text, contentWidth);
        doc.text(lines, margin, curY);
        curY += lines.length * 6.5 + 4;
      } else if (block.type === 'h3') {
        curY += 4;
        if (curY > pageHeight - margin - 15) {
          doc.addPage();
          pageNumber++;
          addHeaderAndFooter(pageNumber);
          curY = 25;
        }
        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(block.text, contentWidth);
        doc.text(lines, margin, curY);
        curY += lines.length * 5.5 + 3;
      } else if (block.type === 'quote') {
        curY += 3;
        const lines = doc.splitTextToSize(block.text, contentWidth - 14);
        const boxHeight = lines.length * 5.5 + 6;

        if (curY + boxHeight > pageHeight - margin - 15) {
          doc.addPage();
          pageNumber++;
          addHeaderAndFooter(pageNumber);
          curY = 25;
        }

        // Draw left bar
        doc.setFillColor(239, 246, 255);
        doc.rect(margin, curY - 2, contentWidth, boxHeight, 'F');
        doc.setFillColor(37, 99, 235);
        doc.rect(margin, curY - 2, 3, boxHeight, 'F');

        doc.setFont('times', 'italic');
        doc.setFontSize(10.5);
        doc.setTextColor(30, 58, 138);
        doc.text(lines, margin + 8, curY + 4);
        curY += boxHeight + 4;
      } else {
        // Normal paragraph or list item
        doc.setFont('times', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(block.text, contentWidth);

        lines.forEach((line: string) => {
          if (curY > pageHeight - margin - 15) {
            doc.addPage();
            pageNumber++;
            addHeaderAndFooter(pageNumber);
            curY = 25;
          }
          doc.text(line, margin, curY);
          curY += 5.5;
        });
        curY += 3;
      }
    });
  });

  // 6. Conclusion
  if (ebook.conclusion) {
    doc.addPage();
    pageNumber++;
    addHeaderAndFooter(pageNumber);

    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('Kesimpulan & Penutup', margin, 30);

    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(51, 65, 85);
    const concLines = doc.splitTextToSize(stripHtml(ebook.conclusion), contentWidth);

    let curY = 42;
    concLines.forEach((line: string) => {
      if (curY > pageHeight - margin - 15) {
        doc.addPage();
        pageNumber++;
        addHeaderAndFooter(pageNumber);
        curY = 25;
      }
      doc.text(line, margin, curY);
      curY += 5.5;
    });
  }

  const pdfBlob = doc.output('blob');
  return { blob: pdfBlob, size: pdfBlob.size };
}

// --- 2. EXPORT TO DOCX ---
export async function generateDocx(ebook: Ebook, options: ExportOptions): Promise<{ blob: Blob; size: number }> {
  const docChildren: any[] = [];

  // Cover / Title Page
  if (options.includeCover) {
    docChildren.push(
      new Paragraph({
        text: ebook.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 400 },
      })
    );

    if (ebook.subtitle) {
      docChildren.push(
        new Paragraph({
          text: ebook.subtitle,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 1200 },
        })
      );
    }

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Penulis: ${ebook.coverSettings.author || 'Penulis'}`,
            bold: true,
            size: 26,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Target: ${ebook.targetAudience} | Bahasa: ${ebook.language}`,
            italics: true,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 1000 },
      }),
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // Introduction
  if (ebook.introduction) {
    docChildren.push(
      new Paragraph({
        text: 'Pendahuluan',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: stripHtml(ebook.introduction),
        spacing: { after: 400 },
      })
    );
  }

  // Chapters
  (ebook.chapters || []).forEach((chapter) => {
    docChildren.push(
      new Paragraph({
        children: [new PageBreak()],
      }),
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const blocks = parseHtmlToBlocks(chapter.content || `<p>${chapter.summary}</p>`);
    blocks.forEach((block) => {
      if (block.type === 'h1' && block.text === chapter.title) return;

      if (block.type === 'h2') {
        docChildren.push(
          new Paragraph({
            text: block.text,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
      } else if (block.type === 'h3') {
        docChildren.push(
          new Paragraph({
            text: block.text,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (block.type === 'quote') {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `"${block.text}"`,
                italics: true,
              }),
            ],
            indent: { left: 720 },
            spacing: { before: 150, after: 150 },
          })
        );
      } else {
        docChildren.push(
          new Paragraph({
            text: block.text,
            spacing: { after: 200 },
          })
        );
      }
    });
  });

  // Conclusion
  if (ebook.conclusion) {
    docChildren.push(
      new Paragraph({
        children: [new PageBreak()],
      }),
      new Paragraph({
        text: 'Kesimpulan',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: stripHtml(ebook.conclusion),
        spacing: { after: 400 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return { blob, size: blob.size };
}

// --- 3. EXPORT TO EPUB ---
export async function generateEpub(ebook: Ebook): Promise<{ blob: Blob; size: number }> {
  const zip = new JSZip();

  // 1. mimetype (must be uncompressed at the root)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.folder('META-INF')!.file('container.xml', containerXml);

  // 3. CSS stylesheet
  const css = `
body { font-family: sans-serif; line-height: 1.6; margin: 5%; color: #1e293b; }
h1 { color: #0f172a; margin-top: 1.5em; border-bottom: 2px solid #3b82f6; padding-bottom: 0.3em; }
h2 { color: #1e3a8a; margin-top: 1.2em; }
p { margin: 0.8em 0; text-align: justify; }
blockquote { border-left: 4px solid #3b82f6; margin: 1em 0; padding-left: 1em; color: #1e40af; font-style: italic; background: #eff6ff; padding: 0.5em 1em; }
ul, ol { margin: 1em 0 1em 2em; }
.cover { text-align: center; padding: 15% 5%; }
.cover h1 { border: none; font-size: 2.2em; }
.cover .author { margin-top: 2em; font-weight: bold; }
`;
  zip.folder('OEBPS')!.file('style.css', css);

  // Cover XHTML
  const coverHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${ebook.title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div class="cover">
    <h1>${ebook.title}</h1>
    <p><em>${ebook.subtitle || ''}</em></p>
    <div class="author">${ebook.coverSettings.author || 'Penulis'}</div>
  </div>
</body>
</html>`;
  zip.folder('OEBPS')!.file('cover.xhtml', coverHtml);

  // Chapters XHTML
  const chapters = (ebook.chapters || []).sort((a, b) => a.position - b.position);
  const chapterFiles: { id: string; filename: string; title: string }[] = [];

  chapters.forEach((ch, idx) => {
    const filename = `chapter_${idx + 1}.xhtml`;
    const id = `chap_${idx + 1}`;
    chapterFiles.push({ id, filename, title: ch.title });

    const chContent = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${ch.title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${ch.title}</h1>
  ${ch.content || `<p>${ch.summary}</p>`}
</body>
</html>`;
    zip.folder('OEBPS')!.file(filename, chContent);
  });

  // content.opf
  const manifestItems = chapterFiles
    .map((c) => `<item id="${c.id}" href="${c.filename}" media-type="application/xhtml+xml"/>`)
    .join('\n    ');
  const spineItems = chapterFiles.map((c) => `<itemref idref="${c.id}"/>`).join('\n    ');

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${ebook.title}</dc:title>
    <dc:creator>${ebook.coverSettings.author || 'Penulis'}</dc:creator>
    <dc:language>${ebook.language === 'English' ? 'en' : 'id'}</dc:language>
    <dc:identifier id="BookId">urn:uuid:${ebook.id}</dc:identifier>
  </metadata>
  <manifest>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
    ${manifestItems}
  </manifest>
  <spine>
    <itemref idref="cover"/>
    ${spineItems}
  </spine>
</package>`;
  zip.folder('OEBPS')!.file('content.opf', contentOpf);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  return { blob, size: blob.size };
}

// --- 4. EXPORT TO MARKDOWN ---
export function generateMarkdown(ebook: Ebook): { blob: Blob; size: number } {
  let md = `---
title: "${ebook.title}"
subtitle: "${ebook.subtitle || ''}"
author: "${ebook.coverSettings.author || 'Penulis'}"
target_audience: "${ebook.targetAudience}"
language: "${ebook.language}"
date: "${new Date().toISOString().split('T')[0]}"
generator: "Ebook Generator AI"
---

# ${ebook.title}
${ebook.subtitle ? `*${ebook.subtitle}*\n` : ''}
**Penulis:** ${ebook.coverSettings.author || 'Penulis'}  
**Target Pembaca:** ${ebook.targetAudience}  

---

## Tentang Ebook Ini
${ebook.conceptSummary || ebook.idea}

`;

  if (ebook.introduction) {
    md += `## Pendahuluan\n\n${stripHtml(ebook.introduction)}\n\n---\n\n`;
  }

  const chapters = (ebook.chapters || []).sort((a, b) => a.position - b.position);
  chapters.forEach((ch) => {
    md += `# ${ch.title}\n\n`;
    if (ch.summary) {
      md += `> ${ch.summary}\n\n`;
    }

    const blocks = parseHtmlToBlocks(ch.content || '');
    blocks.forEach((b) => {
      if (b.type === 'h1' && b.text === ch.title) return;
      if (b.type === 'h2') md += `## ${b.text}\n\n`;
      else if (b.type === 'h3') md += `### ${b.text}\n\n`;
      else if (b.type === 'quote') md += `> ${b.text}\n\n`;
      else if (b.type === 'list_item') md += `${b.text}\n`;
      else md += `${b.text}\n\n`;
    });

    md += '\n---\n\n';
  });

  if (ebook.conclusion) {
    md += `## Kesimpulan & Langkah Selanjutnya\n\n${stripHtml(ebook.conclusion)}\n\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  return { blob, size: blob.size };
}

// Master exporter runner
export async function downloadEbookFile(
  ebook: Ebook,
  format: 'pdf' | 'docx' | 'epub' | 'markdown',
  options: ExportOptions
): Promise<{ size: number }> {
  const sanitizeName = (ebook.title || 'ebook').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);

  if (format === 'pdf') {
    const { blob, size } = await generatePdf(ebook, options);
    triggerDownload(blob, `${sanitizeName}.pdf`);
    return { size };
  } else if (format === 'docx') {
    const { blob, size } = await generateDocx(ebook, options);
    triggerDownload(blob, `${sanitizeName}.docx`);
    return { size };
  } else if (format === 'epub') {
    const { blob, size } = await generateEpub(ebook);
    triggerDownload(blob, `${sanitizeName}.epub`);
    return { size };
  } else {
    const { blob, size } = generateMarkdown(ebook);
    triggerDownload(blob, `${sanitizeName}.md`);
    return { size };
  }
}
