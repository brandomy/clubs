---
description: Extract PDF to markdown using two-pass hybrid system
allowed-tools: Read, Bash, Write
---

# Extract PDF to Markdown (Two-Pass System)

Extract a PDF document to clean, semantically organized markdown using a two-pass hybrid approach that combines automated metadata extraction with Claude's native PDF reading capability.

## Usage

```
/extract-pdf $ARGUMENTS
```

**Options**:
- `/extract-pdf /path/to/document.pdf` - Extract specific PDF
- `/extract-pdf` - Interactive mode (asks for path)

## Process

### Pass 1: Automated Metadata Extraction (Deno Script)

1. **Run the deno script** to extract embedded PDF metadata:
   ```bash
   deno task extract-pdf -- "[path-to-pdf]" --mode=metadata
   ```

2. **Capture metadata** from the JSON output:
   - Author
   - Creation date
   - Creator application
   - Total page count
   - Any other embedded metadata fields

3. **Note**: The metadata JSON will be saved alongside the PDF. Read it to incorporate into the final markdown header.

### Pass 2: Semantic Content Extraction (Claude Native PDF Reading)

4. **Read the PDF** using Claude's native PDF reading capability (the Read tool)

5. **Analyze the document structure**:
   - Identify document type (presentation, report, article, form, etc.)
   - Identify logical sections and hierarchy
   - Identify tables, lists, and special formatting
   - Note any images or charts (describe their content/purpose)

6. **Create semantically organized markdown**:
   - Use proper heading hierarchy (H1 for title, H2 for major sections, etc.)
   - Format tables properly with aligned columns
   - Use blockquotes for quotes/callouts
   - Use bullet/numbered lists appropriately
   - Clean up any OCR artifacts or spacing issues
   - Preserve important formatting (bold, italic) where meaningful
   - Include source attribution if present in document

### Pass 3: Combine and Save

7. **Merge metadata with content**:
   - Use metadata from Pass 1 for the document header
   - Use semantic content from Pass 2 for the body
   - Add extraction timestamp

8. **Save the markdown file**:
   - Save in the same directory as the source PDF
   - Use the same filename with `.md` extension
   - Example: `report.pdf` → `report.md`
   - Delete the temporary metadata JSON file

9. **Report completion**:
   - Confirm the output file path
   - Provide a brief summary of what was extracted (page count, sections, tables, etc.)

## Output Format

The markdown should include:

```markdown
# [Document Title]

**Source:** [Original filename]
**Author:** [From PDF metadata]
**Created:** [From PDF metadata - YYYY-MM-DD format]
**Pages:** [Page count from metadata]
**Extracted:** [Today's date]

---

[Clean, semantically organized content from Claude's PDF reading...]
```

## Quality Standards

- Text should flow naturally and be human-readable
- Tables should have proper headers and alignment
- No duplicate content
- No broken formatting
- No OCR artifacts (e.g., "S hanghai" → "Shanghai")
- Preserve all substantive content from the original

## Why Two-Pass?

| Pass | Tool | Extracts | Strength |
|------|------|----------|----------|
| Pass 1 | Deno script (`extract-pdf.ts`) | Embedded PDF metadata (author, date, creator) | Accesses binary PDF fields Claude can't see |
| Pass 2 | Claude native PDF reading | Semantic document content | Superior understanding of visual layout, context, and meaning |

**Result**: Best of both worlds - accurate metadata + clean semantic content.

## Notes

- Pass 1 (deno) captures metadata embedded in PDF binary structure
- Pass 2 (Claude) understands visual layout and produces human-readable prose
- This approach dramatically outperforms either tool used alone
- Especially effective for presentations, reports, and visually complex documents

---

## Success Criteria

- [ ] Metadata extracted (author, date, page count)
- [ ] Markdown file created with same name as PDF
- [ ] Heading hierarchy reflects document structure
- [ ] Tables properly formatted with aligned columns
- [ ] No OCR artifacts or broken formatting
- [ ] All substantive content preserved

---

## When Things Go Wrong

### Metadata Extraction Fails
**Problem**: Deno script errors or returns empty metadata
**Fix**: Proceed with Pass 2 only. Add note that metadata was unavailable.

### PDF Not Readable
**Problem**: Claude can't read the PDF (corrupted or encrypted)
**Fix**: Check if PDF is password-protected. Try opening in Preview/Adobe first.

### Tables Misaligned
**Problem**: Table columns don't align in markdown output
**Fix**: Manually adjust column widths. Use consistent spacing.

### OCR Artifacts
**Problem**: Broken words like "S hanghai" or "ex pert"
**Fix**: Manually clean up. Common with scanned documents.

---

## Workflow Integration

### Research Ingestion
After extracting research PDFs, move to `research/[subject-slug]/` folder.

### Archive Extraction
For archived reports, save markdown alongside PDF for future reference.
