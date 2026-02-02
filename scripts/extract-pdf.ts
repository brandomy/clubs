#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net
/**
 * PDF Extraction Toolkit v1.1
 *
 * Extracts content from PDF files in multiple formats with AI-optimized markdown output.
 *
 * Extraction Modes:
 * 1. PDF → Markdown (full conversion with metadata header)
 * 2. PDF → Plain text
 * 3. PDF → Tables (markdown format)
 * 4. PDF → CSV files (one per table)
 * 5. PDF → Metadata (JSON)
 * 6. PDF → Hyperlinks (JSON)
 * 7. PDF → Images (detection)
 *
 * v1.1 Enhancements (AI-Optimized):
 * - Structured metadata header (author, date, page count, extraction timestamp)
 * - Descriptive table names (generated from column headers)
 * - Page-specific table sections for better context
 *
 * Usage:
 *   deno task extract-pdf -- <input.pdf> [options]
 *
 * Options:
 *   --mode=<mode>       Extract mode: md|text|tables|csv|metadata|links|images (default: md)
 *   --output=<path>     Output file/directory (default: auto-generated)
 *   --pages=<range>     Page range: "1-5" or "1,3,5" (default: all)
 *
 * Examples:
 *   deno task extract-pdf -- document.pdf --mode=md
 *   deno task extract-pdf -- document.pdf --mode=text --output=output.txt
 *   deno task extract-pdf -- document.pdf --mode=csv --output=tables/
 *
 * Documentation: docs/technical/pdf-extraction-system.md
 */

import * as pdfjs from "npm:pdfjs-dist@4.0.379";

// Configure PDF.js worker
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs";

interface ExtractOptions {
  mode: 'md' | 'text' | 'tables' | 'csv' | 'images' | 'metadata' | 'links';
  output?: string;
  pages?: string;
}

interface TableCell {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Table {
  rows: string[][];
  page: number;
}

/**
 * Parse page range string to array of page numbers
 */
function parsePageRange(range: string, totalPages: number): number[] {
  if (!range) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();

  // Handle comma-separated pages: "1,3,5"
  if (range.includes(',')) {
    range.split(',').forEach(p => {
      const page = parseInt(p.trim());
      if (page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    });
    return Array.from(pages).sort((a, b) => a - b);
  }

  // Handle range: "1-5"
  if (range.includes('-')) {
    const [start, end] = range.split('-').map(p => parseInt(p.trim()));
    for (let i = start; i <= Math.min(end, totalPages); i++) {
      pages.add(i);
    }
    return Array.from(pages).sort((a, b) => a - b);
  }

  // Single page
  const page = parseInt(range);
  if (page >= 1 && page <= totalPages) {
    pages.add(page);
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Extract text content from PDF
 */
async function extractText(pdfPath: string, pageNumbers?: number[]): Promise<string> {
  const data = await Deno.readFile(pdfPath);
  const pdf = await pdfjs.getDocument({ data }).promise;

  const totalPages = pdf.numPages;
  const pages = pageNumbers || Array.from({ length: totalPages }, (_, i) => i + 1);

  const textParts: string[] = [];

  for (const pageNum of pages) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    textParts.push(`\n--- Page ${pageNum} ---\n${pageText}`);
  }

  return textParts.join('\n\n');
}

/**
 * Detect tables in PDF by analyzing text positioning
 */
async function extractTables(pdfPath: string, pageNumbers?: number[]): Promise<Table[]> {
  const data = await Deno.readFile(pdfPath);
  const pdf = await pdfjs.getDocument({ data }).promise;

  const totalPages = pdf.numPages;
  const pages = pageNumbers || Array.from({ length: totalPages }, (_, i) => i + 1);

  const tables: Table[] = [];

  for (const pageNum of pages) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by Y position (rows)
    const rowMap = new Map<number, TableCell[]>();

    for (const item of textContent.items as any[]) {
      if (!item.str.trim()) continue;

      const y = Math.round(item.transform[5]); // Y position
      const x = Math.round(item.transform[4]); // X position

      if (!rowMap.has(y)) {
        rowMap.set(y, []);
      }

      rowMap.get(y)!.push({
        text: item.str,
        x,
        y,
        width: item.width,
        height: item.height,
      });
    }

    // Sort rows by Y position (top to bottom)
    const sortedRows = Array.from(rowMap.entries())
      .sort((a, b) => b[0] - a[0]); // PDF Y increases upward

    // Detect table-like structure (3+ consecutive rows with similar column structure)
    let currentTable: string[][] = [];
    let lastRowCols = 0;
    let consecutiveTableRows = 0;

    for (const [_, cells] of sortedRows) {
      // Sort cells by X position (left to right)
      const sortedCells = cells.sort((a, b) => a.x - b.x);

      // Detect columns by clustering X positions
      const columns = detectColumns(sortedCells);
      const row = columns.map(col => col.map(c => c.text).join(' '));

      // Check if this looks like a table row (2+ columns)
      if (row.length >= 2) {
        if (Math.abs(row.length - lastRowCols) <= 1 || currentTable.length === 0) {
          currentTable.push(row);
          consecutiveTableRows++;
        } else {
          // Column count changed significantly, save previous table
          if (consecutiveTableRows >= 3 && !isLikelyFalsePositive(currentTable)) {
            tables.push({ rows: currentTable, page: pageNum });
          }
          currentTable = [row];
          consecutiveTableRows = 1;
        }
        lastRowCols = row.length;
      } else {
        // Not a table row, save accumulated table if valid
        if (consecutiveTableRows >= 3 && !isLikelyFalsePositive(currentTable)) {
          tables.push({ rows: currentTable, page: pageNum });
        }
        currentTable = [];
        consecutiveTableRows = 0;
        lastRowCols = 0;
      }
    }

    // Save last table if valid
    if (consecutiveTableRows >= 3 && !isLikelyFalsePositive(currentTable)) {
      tables.push({ rows: currentTable, page: pageNum });
    }
  }

  return tables;
}

/**
 * Detect column boundaries by clustering X positions
 */
function detectColumns(cells: TableCell[]): TableCell[][] {
  if (cells.length === 0) return [];

  const threshold = 20; // Pixels to consider same column
  const columns: TableCell[][] = [];

  let currentColumn: TableCell[] = [cells[0]];
  let currentX = cells[0].x;

  for (let i = 1; i < cells.length; i++) {
    const cell = cells[i];

    if (Math.abs(cell.x - currentX) > threshold) {
      // New column
      columns.push(currentColumn);
      currentColumn = [cell];
      currentX = cell.x;
    } else {
      // Same column
      currentColumn.push(cell);
    }
  }

  columns.push(currentColumn);
  return columns;
}

/**
 * Phase 1 Content Heuristics: Detect if a table is likely a false positive
 * Filters out: Table of Contents, Glossaries, Sidebars/Callouts
 */
function isLikelyFalsePositive(rows: string[][]): boolean {
  if (rows.length === 0) return false;

  // Pattern 1: Table of Contents
  if (hasTOCPattern(rows)) return true;

  // Pattern 2: Glossary
  if (hasGlossaryPattern(rows)) return true;

  // Pattern 3: Sidebar/Callout
  if (hasSidebarPattern(rows)) return true;

  return false;
}

/**
 * Detect Table of Contents patterns
 * Indicators: "Chapter X:", "Appendix X", page numbers in second column
 */
function hasTOCPattern(rows: string[][]): boolean {
  // Check for "Chapter X:" or "Appendix X" patterns
  const hasChapterPattern = rows.some(row =>
    /Chapter \d+:|Appendix [A-Z\d]|Section \d+/i.test(row.join(' '))
  );

  if (hasChapterPattern) return true;

  // Check if second column is all page numbers (2+ rows)
  if (rows[0].length >= 2 && rows.length >= 2) {
    const secondColumn = rows.map(r => r[1] || '').filter(c => c.trim());
    if (secondColumn.length >= 2) {
      const allNumbers = secondColumn.every(cell => /^\d+$/.test(cell.trim()));
      if (allNumbers) return true;
    }
  }

  return false;
}

/**
 * Detect glossary patterns
 * Indicators: ALL CAPS header + definition-style text (multi-sentence, explanatory)
 */
function hasGlossaryPattern(rows: string[][]): boolean {
  if (rows.length < 2) return false;

  // Check for ALL CAPS header (both columns or majority)
  const firstRow = rows[0];
  const allCapsCount = firstRow.filter(cell => {
    const trimmed = cell.trim();
    return trimmed.length > 0 &&
           trimmed === trimmed.toUpperCase() &&
           /^[A-Z\s]+$/.test(trimmed);
  }).length;

  const hasAllCapsHeader = allCapsCount >= Math.ceil(firstRow.length / 2);

  if (!hasAllCapsHeader) return false;

  // Check for definition-style content (paragraphs with lowercase text)
  // Glossaries typically have explanatory text with complete sentences
  const dataRows = rows.slice(1).filter(r => r.length >= 2);
  if (dataRows.length < 2) return false;

  // Count rows with lowercase explanation text (not just short data values)
  const definitionStyleCount = dataRows.filter(row => {
    const text = row.join(' ');
    // Must have lowercase letters (not just caps/numbers)
    const hasLowercase = /[a-z]/.test(text);
    // Must be reasonably long (>20 chars total)
    const isSubstantial = text.trim().length > 20;
    return hasLowercase && isSubstantial;
  }).length;

  const definitionRatio = definitionStyleCount / dataRows.length;

  // If most rows are explanatory text with ALL CAPS header, likely glossary
  return definitionRatio >= 0.7;
}

/**
 * Detect sidebar/callout patterns
 * Indicators: "Note:", "Tip:", "Warning:", etc.
 */
function hasSidebarPattern(rows: string[][]): boolean {
  // Check for callout words
  const calloutWords = [
    'Note:', 'Tip:', 'Warning:', 'Remember:', 'Important:',
    'GOOD TO KNOW', 'DID YOU KNOW', 'FUN FACT', 'CAUTION:'
  ];

  const hasCallout = rows.some(row =>
    calloutWords.some(word => row.join(' ').includes(word))
  );

  return hasCallout;
}

/**
 * Generate descriptive table name from header row
 */
function generateTableName(table: Table): string {
  if (table.rows.length === 0) return 'Data Table';

  const headerRow = table.rows[0];

  // Try to create a meaningful name from header columns
  const cleanedHeaders = headerRow
    .filter(h => h.trim().length > 0)
    .map(h => h.trim())
    .slice(0, 3); // Use first 3 columns max

  if (cleanedHeaders.length >= 2) {
    // If we have meaningful headers, use them
    const hasWords = cleanedHeaders.some(h => /[a-zA-Z]{3,}/.test(h));
    if (hasWords) {
      return cleanedHeaders.join(' / ');
    }
  }

  // Fallback: generic name
  return 'Data Table';
}

/**
 * Convert tables to markdown format with descriptive headers
 */
function tablesToMarkdown(tables: Table[], includeDescription = true): string {
  const parts: string[] = [];

  tables.forEach((table, idx) => {
    const tableName = includeDescription ? generateTableName(table) : null;

    if (tableName && tableName !== 'Data Table') {
      parts.push(`#### Table ${idx + 1}: ${tableName} (Page ${table.page})\n`);
    } else {
      parts.push(`#### Table ${idx + 1} (Page ${table.page})\n`);
    }

    if (table.rows.length === 0) return;

    // Header row
    const header = table.rows[0];
    parts.push('| ' + header.join(' | ') + ' |');
    parts.push('| ' + header.map(() => '---').join(' | ') + ' |');

    // Data rows
    for (let i = 1; i < table.rows.length; i++) {
      const row = table.rows[i];
      // Pad row to match header length
      while (row.length < header.length) {
        row.push('');
      }
      parts.push('| ' + row.join(' | ') + ' |');
    }

    parts.push('');
  });

  return parts.join('\n');
}

/**
 * Convert tables to CSV files
 */
async function tablesToCSV(tables: Table[], outputDir: string): Promise<void> {
  await Deno.mkdir(outputDir, { recursive: true });

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const csvPath = `${outputDir}/table-${i + 1}-page-${table.page}.csv`;

    const csvLines = table.rows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        const escaped = cell.replace(/"/g, '""');
        return /[",\n]/.test(cell) ? `"${escaped}"` : escaped;
      }).join(',')
    );

    await Deno.writeTextFile(csvPath, csvLines.join('\n'));
    console.log(`✓ Saved: ${csvPath}`);
  }
}

/**
 * Extract metadata from PDF
 */
async function extractMetadata(pdfPath: string): Promise<Record<string, any>> {
  const data = await Deno.readFile(pdfPath);
  const pdf = await pdfjs.getDocument({ data }).promise;

  const metadata = await pdf.getMetadata();

  return {
    info: metadata.info,
    metadata: metadata.metadata?.getAll() || {},
    numPages: pdf.numPages,
  };
}

/**
 * Extract hyperlinks from PDF
 */
async function extractLinks(pdfPath: string, pageNumbers?: number[]): Promise<any[]> {
  const data = await Deno.readFile(pdfPath);
  const pdf = await pdfjs.getDocument({ data }).promise;

  const totalPages = pdf.numPages;
  const pages = pageNumbers || Array.from({ length: totalPages }, (_, i) => i + 1);

  const allLinks: any[] = [];

  for (const pageNum of pages) {
    const page = await pdf.getPage(pageNum);
    const annotations = await page.getAnnotations();

    const links = annotations
      .filter((ann: any) => ann.subtype === 'Link')
      .map((ann: any) => ({
        page: pageNum,
        url: ann.url || ann.dest,
        rect: ann.rect,
        text: ann.contents || '',
      }));

    allLinks.push(...links);
  }

  return allLinks;
}

/**
 * Extract images from PDF
 */
async function extractImages(pdfPath: string, outputDir: string, pageNumbers?: number[]): Promise<void> {
  const data = await Deno.readFile(pdfPath);
  const pdf = await pdfjs.getDocument({ data }).promise;

  const totalPages = pdf.numPages;
  const pages = pageNumbers || Array.from({ length: totalPages }, (_, i) => i + 1);

  await Deno.mkdir(outputDir, { recursive: true });

  let imageCount = 0;

  for (const pageNum of pages) {
    const page = await pdf.getPage(pageNum);
    const ops = await page.getOperatorList();

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];

      // Check if this is a paint image operation
      if (fn === pdfjs.OPS.paintImageXObject) {
        const imageName = ops.argsArray[i][0];

        try {
          const image = await page.objs.get(imageName);

          if (image && image.data) {
            imageCount++;
            const filename = `${outputDir}/page-${pageNum}-image-${imageCount}.png`;

            // Create a canvas to render the image (simplified - you may need canvas library)
            console.log(`  Found image: ${filename} (${image.width}x${image.height})`);

            // Note: Actual image extraction requires canvas rendering
            // This is a simplified version showing detection
          }
        } catch (err) {
          console.warn(`  Warning: Could not extract image ${imageName}: ${err.message}`);
        }
      }
    }
  }

  console.log(`✓ Found ${imageCount} images across ${pages.length} pages`);
  console.log(`  Note: Full image extraction requires canvas library (not yet implemented)`);
}

/**
 * Phase 2A Enhancement: Detect if a line is an all-caps heading
 * Criteria: >70% uppercase, 10+ chars, doesn't end with sentence punctuation
 */
function isAllCapsHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 10) return false;

  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 8) return false;

  const uppercaseCount = (trimmed.match(/[A-Z]/g) || []).length;
  const uppercaseRatio = uppercaseCount / letters.length;

  // >70% uppercase and doesn't end with sentence punctuation
  return uppercaseRatio > 0.7 && !/[.!?]$/.test(trimmed);
}

/**
 * Phase 2A Enhancement: Normalize spaced-out headings
 * Example: "H O W  T O" → "HOW TO"
 */
function normalizeSpacedHeading(line: string): string {
  // Detect: "H O W  T O" pattern (2+ spaces between letters)
  if (/^([A-Z]\s{2,}){3,}/.test(line)) {
    return line.replace(/\s{2,}/g, ' ').trim();
  }
  return line;
}

/**
 * Phase 2A Enhancement: Process bullet lists in text
 * Detects inline bullets with multi-space separators and converts to markdown
 */
function processBulletLists(lines: string[]): string[] {
  const processed: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern 1: Inline bullets with multi-space separators (3+ spaces)
    // Example: "The guide covers:   Item 1   Item 2   Item 3"
    // Split on 3+ consecutive spaces to avoid false positives from normal spacing
    const multiSpaceParts = line.split(/\s{3,}/);

    if (multiSpaceParts.length >= 3) {
      // Check if first part ends with colon (list introduction)
      if (/:$/.test(multiSpaceParts[0].trim())) {
        processed.push(multiSpaceParts[0].trim());

        // Remaining parts are bullet items
        for (let j = 1; j < multiSpaceParts.length; j++) {
          const item = multiSpaceParts[j].trim();
          if (item && item.length > 0) {
            processed.push(`- ${item}`);
          }
        }
        continue;
      }
    }

    // Pattern 2: Line starts with bullet symbol
    const bulletMatch = line.trim().match(/^([•\-–—*◦])\s+(.+)$/);
    if (bulletMatch) {
      processed.push(`- ${bulletMatch[2]}`);
      continue;
    }

    // Pattern 3: Numbered list items
    const numberedMatch = line.trim().match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      processed.push(`${numberedMatch[1]}. ${numberedMatch[2]}`);
      continue;
    }

    // No special formatting needed
    processed.push(line);
  }

  return processed;
}

/**
 * Phase 2B Enhancement: Format URLs and email addresses as markdown links
 */
function formatLinks(text: string): string {
  // Email addresses (must come before URLs to avoid false positives)
  // Match: name@domain.com
  text = text.replace(
    /\b([a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/gi,
    '[$1](mailto:$1)'
  );

  // URLs without protocol (domain.com/path)
  // Negative lookahead to avoid re-linking already linked URLs
  text = text.replace(
    /\b((?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s)]*)?)\b(?![^\[]*\]|\))/gi,
    (match) => {
      // Skip if already in a markdown link
      if (match.includes('[') || match.includes(']')) {
        return match;
      }
      return `[${match}](https://${match})`;
    }
  );

  return text;
}

/**
 * Convert PDF to Markdown
 */
async function pdfToMarkdown(pdfPath: string, pageNumbers?: number[]): Promise<string> {
  const data = await Deno.readFile(pdfPath);
  const pdf = await pdfjs.getDocument({ data }).promise;

  const totalPages = pdf.numPages;
  const pages = pageNumbers || Array.from({ length: totalPages }, (_, i) => i + 1);

  // Extract metadata for header
  const metadata = await pdf.getMetadata();
  const fileName = pdfPath.split('/').pop()?.replace('.pdf', '') || 'document';

  const parts: string[] = [];

  // Add document title
  const title = metadata.info?.Title || fileName;
  parts.push(`# ${title}\n`);

  // Add metadata header
  parts.push(`**SOURCE METADATA**\n`);

  if (metadata.info?.Author) {
    parts.push(`- **Author**: ${metadata.info.Author}`);
  }

  if (metadata.info?.Creator) {
    parts.push(`- **Created with**: ${metadata.info.Creator}`);
  }

  if (metadata.info?.CreationDate) {
    // Parse PDF date format: D:20221108153509-06'00'
    const dateStr = metadata.info.CreationDate.toString();
    const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})/);
    if (match) {
      const [_, year, month, day] = match;
      parts.push(`- **Creation Date**: ${year}-${month}-${day}`);
    }
  }

  parts.push(`- **Total Pages**: ${totalPages}`);

  if (pageNumbers) {
    parts.push(`- **Pages Extracted**: ${pageNumbers.join(', ')}`);
  }

  // Add extraction timestamp
  const now = new Date().toISOString().split('T')[0];
  parts.push(`- **Extracted**: ${now}`);

  parts.push(`\n---\n`);

  // Extract text and tables together
  const tables = await extractTables(pdfPath, pageNumbers);
  const tablesByPage = new Map<number, Table[]>();

  tables.forEach(table => {
    if (!tablesByPage.has(table.page)) {
      tablesByPage.set(table.page, []);
    }
    tablesByPage.get(table.page)!.push(table);
  });

  for (const pageNum of pages) {
    parts.push(`\n## Page ${pageNum}\n`);

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Extract text with paragraph detection based on Y position
    const lines: string[] = [];
    let currentLine: string[] = [];
    let lastY = -1;
    const lineThreshold = 10; // Pixels - detect line breaks

    for (const item of textContent.items as any[]) {
      if (!item.str.trim()) continue;

      const y = Math.round(item.transform[5]);

      // New line detected (Y position changed)
      if (lastY !== -1 && Math.abs(y - lastY) > lineThreshold) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
          currentLine = [];
        }
      }

      currentLine.push(item.str);
      lastY = y;
    }

    // Push last line
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    // Phase 2A: Process bullet lists first
    const bulletProcessedLines = processBulletLists(lines);

    // Detect paragraph breaks based on line patterns
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];

    for (let i = 0; i < bulletProcessedLines.length; i++) {
      const line = bulletProcessedLines[i].trim();
      const nextLine = bulletProcessedLines[i + 1]?.trim();

      // Phase 2A: Check for all-caps headings
      const normalizedLine = normalizeSpacedHeading(line);
      if (isAllCapsHeading(normalizedLine)) {
        // Flush current paragraph
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
        // Add heading with proper spacing
        paragraphs.push(`### ${normalizedLine}\n`);
        continue;
      }

      // Bullet or numbered list items should be standalone
      if (line.startsWith('-') || /^\d+\.\s/.test(line)) {
        // Flush current paragraph
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
        paragraphs.push(line);
        continue;
      }

      currentParagraph.push(line);

      // Paragraph break indicators:
      // 1. TOC entry: line ends with 1-3 digit number (likely page number)
      // 2. Line ends with period AND next line starts with bullet/number/capital
      // 3. Line is significantly shorter (likely paragraph end)
      // 4. Next line is a heading (all caps or starts with "Chapter", etc.)
      if (nextLine) {
        const endsWithPageNumber = /\s+\d{1,3}$/.test(line); // TOC entries
        const endsWithPeriod = /\.$/.test(line);
        const nextIsBullet = /^[•\-–—*\d+\.]/.test(nextLine);
        const nextIsHeading = isAllCapsHeading(normalizeSpacedHeading(nextLine)) ||
                             /^(Chapter|Section|Part|Appendix)\s/.test(nextLine);
        const shortLine = line.length < 60;
        const significantGap = line.length > 50 && nextLine.length > 50 && Math.abs(line.length - nextLine.length) > 40;

        if (endsWithPageNumber ||
            (endsWithPeriod && (nextIsBullet || nextIsHeading)) ||
            (endsWithPeriod && shortLine) ||
            significantGap) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
      }
    }

    // Push last paragraph
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '));
    }

    // Join paragraphs with double newline
    let pageText = paragraphs.join('\n\n');

    // Phase 2B: Format links (URLs and emails)
    pageText = formatLinks(pageText);

    parts.push(pageText + '\n');

    // Add tables for this page
    const pageTables = tablesByPage.get(pageNum);
    if (pageTables && pageTables.length > 0) {
      parts.push('\n### Tables on Page ' + pageNum + '\n');

      // Calculate global table index
      const allTablesSoFar = Array.from(tablesByPage.entries())
        .filter(([p]) => p < pageNum)
        .reduce((sum, [_, tables]) => sum + tables.length, 0);

      pageTables.forEach((table, idx) => {
        const globalIdx = allTablesSoFar + idx;
        const tableName = generateTableName(table);

        if (tableName && tableName !== 'Data Table') {
          parts.push(`#### Table ${globalIdx + 1}: ${tableName}\n`);
        } else {
          parts.push(`#### Table ${globalIdx + 1}\n`);
        }

        if (table.rows.length === 0) return;

        // Header row
        const header = table.rows[0];
        parts.push('| ' + header.join(' | ') + ' |');
        parts.push('| ' + header.map(() => '---').join(' | ') + ' |');

        // Data rows
        for (let i = 1; i < table.rows.length; i++) {
          const row = table.rows[i];
          // Pad row to match header length
          while (row.length < header.length) {
            row.push('');
          }
          parts.push('| ' + row.join(' | ') + ' |');
        }

        parts.push('');
      });
    }
  }

  return parts.join('\n');
}

/**
 * Main extraction function
 */
async function extractPDF(pdfPath: string, options: ExtractOptions): Promise<void> {
  console.log(`📄 Extracting from: ${pdfPath}`);
  console.log(`   Mode: ${options.mode}`);

  // Parse page range
  const data = await Deno.readFile(pdfPath);
  const pdf = await pdfjs.getDocument({ data }).promise;
  const totalPages = pdf.numPages;
  const pageNumbers = options.pages
    ? parsePageRange(options.pages, totalPages)
    : undefined;

  if (pageNumbers) {
    console.log(`   Pages: ${pageNumbers.join(', ')}`);
  }

  const baseName = pdfPath.replace(/\.pdf$/i, '');

  switch (options.mode) {
    case 'text': {
      const text = await extractText(pdfPath, pageNumbers);
      const outputPath = options.output || `${baseName}.txt`;
      await Deno.writeTextFile(outputPath, text);
      console.log(`✓ Text saved: ${outputPath}`);
      break;
    }

    case 'tables': {
      const tables = await extractTables(pdfPath, pageNumbers);
      const markdown = tablesToMarkdown(tables);
      const outputPath = options.output || `${baseName}-tables.md`;
      await Deno.writeTextFile(outputPath, markdown);
      console.log(`✓ Tables saved: ${outputPath} (${tables.length} tables found)`);
      break;
    }

    case 'csv': {
      const tables = await extractTables(pdfPath, pageNumbers);
      const outputDir = options.output || `${baseName}-tables`;
      await tablesToCSV(tables, outputDir);
      console.log(`✓ CSV files saved: ${outputDir}/ (${tables.length} tables)`);
      break;
    }

    case 'metadata': {
      const metadata = await extractMetadata(pdfPath);
      const outputPath = options.output || `${baseName}-metadata.json`;
      await Deno.writeTextFile(outputPath, JSON.stringify(metadata, null, 2));
      console.log(`✓ Metadata saved: ${outputPath}`);
      break;
    }

    case 'links': {
      const links = await extractLinks(pdfPath, pageNumbers);
      const outputPath = options.output || `${baseName}-links.json`;
      await Deno.writeTextFile(outputPath, JSON.stringify(links, null, 2));
      console.log(`✓ Links saved: ${outputPath} (${links.length} links found)`);
      break;
    }

    case 'images': {
      const outputDir = options.output || `${baseName}-images`;
      await extractImages(pdfPath, outputDir, pageNumbers);
      break;
    }

    case 'md':
    default: {
      const markdown = await pdfToMarkdown(pdfPath, pageNumbers);
      const outputPath = options.output || `${baseName}.md`;
      await Deno.writeTextFile(outputPath, markdown);
      console.log(`✓ Markdown saved: ${outputPath}`);
      break;
    }
  }
}

/**
 * CLI Entry Point
 */
if (import.meta.main) {
  const args = Deno.args;

  if (args.length === 0) {
    console.error(`
PDF Extraction Toolkit

Usage:
  deno task extract-pdf -- <input.pdf> [options]

Options:
  --mode=<mode>       Extract mode: md|text|tables|csv|metadata|links|images (default: md)
  --output=<path>     Output file/directory (default: auto-generated)
  --pages=<range>     Page range: "1-5" or "1,3,5" (default: all)

Examples:
  deno task extract-pdf -- document.pdf
  deno task extract-pdf -- document.pdf --mode=text
  deno task extract-pdf -- document.pdf --mode=tables --pages=1-10
  deno task extract-pdf -- document.pdf --mode=csv --output=output/
  deno task extract-pdf -- document.pdf --mode=metadata
  deno task extract-pdf -- document.pdf --mode=links
  deno task extract-pdf -- document.pdf --mode=images
`);
    Deno.exit(1);
  }

  // Filter out '--' separator that deno task adds
  const filteredArgs = args.filter(arg => arg !== '--');

  const pdfPath = filteredArgs[0];
  const options: ExtractOptions = { mode: 'md' };

  // Parse options
  for (let i = 1; i < filteredArgs.length; i++) {
    const arg = filteredArgs[i];

    if (arg.startsWith('--mode=')) {
      const mode = arg.split('=')[1] as ExtractOptions['mode'];
      if (['md', 'text', 'tables', 'csv', 'metadata', 'links', 'images'].includes(mode)) {
        options.mode = mode;
      }
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg.startsWith('--pages=')) {
      options.pages = arg.split('=')[1];
    }
  }

  try {
    await extractPDF(pdfPath, options);
  } catch (error) {
    console.error('❌ Error:', error.message);
    Deno.exit(1);
  }
}
