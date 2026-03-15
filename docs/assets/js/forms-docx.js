/* AEGIS Forms — Shared docx.js utilities
   Loaded on all form pages. Exposes window.AEGISForms namespace.
   Requires docx@8 loaded globally. */

(function () {
  var docx = window.docx;
  if (!docx) {
    console.warn('docx library not loaded — forms-docx.js requires docx@8');
    return;
  }

  var Paragraph = docx.Paragraph;
  var TextRun = docx.TextRun;
  var Table = docx.Table;
  var TableRow = docx.TableRow;
  var TableCell = docx.TableCell;
  var Document = docx.Document;
  var Packer = docx.Packer;
  var WidthType = docx.WidthType;
  var AlignmentType = docx.AlignmentType;
  var BorderStyle = docx.BorderStyle;
  var HeadingLevel = docx.HeadingLevel;

  var COPYRIGHT = '\u00A9 2026 SMAILE (Stockholm Medical Artificial Intelligence and Learning Environments), Karolinska Institutet. All rights reserved.';

  // KI Brand Colors
  var COLOR_PLUM = '870052';
  var COLOR_DARK_PLUM = '4F0433';
  var COLOR_ORANGE = 'FF876F';
  var COLOR_GREY = '666666';
  var COLOR_LIGHT_GREY = 'F1F1F1';

  /**
   * Build document title with KI branding.
   * @param {string} title
   * @param {string} supplement
   * @returns {Paragraph[]}
   */
  function buildTitle(title, supplement) {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: 'SMAILE | Karolinska Institutet',
            color: COLOR_PLUM,
            bold: true,
            size: 18,
            font: 'Arial'
          })
        ],
        border: {
          bottom: { color: COLOR_PLUM, space: 1, style: BorderStyle.SINGLE, size: 6 }
        },
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: title.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 120 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'AEGIS Regulatory Documentation \u2014 Supplement ' + (supplement || ''),
            italics: true,
            color: COLOR_GREY,
            size: 20
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      })
    ];
  }

  /**
   * Build header paragraphs from form values.
   * @param {Object} values - { device_name, intended_use, author_name, author_role, date, org }
   * @returns {Paragraph[]}
   */
  function buildHeader(values) {
    var rows = [
      ['Device name', values.device_name || ''],
      ['Intended use', values.intended_use || ''],
      ['Author', (values.author_name || '') + (values.author_role ? ' (' + values.author_role + ')' : '')],
      ['Date', values.date || ''],
      ['Organisation', values.org || '']
    ];

    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map(function(row) {
          return new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: row[0], bold: true, size: 20 })] })],
                width: { size: 25, type: WidthType.PERCENTAGE },
                shading: { fill: 'F9F9F9' },
                verticalAlign: docx.VerticalAlign.CENTER
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: row[1], size: 20 })] })],
                width: { size: 75, type: WidthType.PERCENTAGE },
                verticalAlign: docx.VerticalAlign.CENTER
              })
            ]
          });
        }),
        spacing: { after: 400 }
      })
    ];
  }

  /**
   * Build a table from column definitions and row data.
   * @param {string[]} columns - Column header labels
   * @param {string[][]} rows - Array of row arrays
   * @param {number[]} [colWidths] - Optional column widths in percentage
   * @returns {Table}
   */
  function buildTable(columns, rows, colWidths) {
    var headerCells = columns.map(function (col, i) {
      return new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: col, bold: true, color: 'FFFFFF', size: 18 })],
            alignment: AlignmentType.CENTER
          })
        ],
        width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
        shading: { fill: COLOR_PLUM },
        verticalAlign: docx.VerticalAlign.CENTER
      });
    });

    var dataRows = rows.map(function (row, rowIndex) {
      return new TableRow({
        children: row.map(function (cell, i) {
          return new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: cell || '', size: 18 })] })],
            width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
            shading: rowIndex % 2 === 1 ? { fill: 'F9F9F9' } : undefined
          });
        })
      });
    });

    return new Table({
      rows: [new TableRow({ children: headerCells, tableHeader: true })].concat(dataRows),
      width: { size: 100, type: WidthType.PERCENTAGE },
      spacing: { after: 240 }
    });
  }

  /**
   * Build a checkbox list for docx output.
   * @param {Array<{id: string, label: string}>} items - All checkbox items
   * @param {string[]} checkedIds - IDs of checked items
   * @returns {Paragraph[]}
   */
  function buildCheckboxList(items, checkedIds) {
    return items.map(function (item) {
      var checked = checkedIds.indexOf(item.id) !== -1;
      return new Paragraph({
        children: [
          new TextRun({
            text: checked ? '\u2611 ' : '\u2610 ',
            font: 'Segoe UI Symbol',
            color: checked ? COLOR_PLUM : COLOR_GREY,
            size: 24
          }),
          new TextRun({ text: item.label, size: 20 })
        ],
        spacing: { after: 100 },
        indent: { left: 240 }
      });
    });
  }

  /**
   * Build version history table.
   * @param {string} authorName
   * @param {string} date
   * @returns {Table}
   */
  function buildVersionHistory(authorName, date) {
    return buildTable(
      ['Version', 'Date', 'Author', 'Change summary'],
      [
        ['1.0', date || '', authorName || '', 'Initial configuration'],
        ['', '', '', ''],
        ['', '', '', '']
      ],
      [10, 20, 25, 45]
    );
  }

  /**
   * Build sign-off block.
   * @returns {Paragraph[]}
   */
  function buildSignoff() {
    var lines = [
      { label: 'Author signature', value: '_______________________________' },
      { label: 'Author name', value: '____________________________________' },
      { label: 'Date', value: '___________________________________________' },
      { label: '', value: '' },
      { label: 'Reviewer name', value: '__________________________________' },
      { label: 'Reviewer role', value: '__________________________________' },
      { label: 'Review date', value: '____________________________________' }
    ];
    return lines.map(function (line) {
      if (line.label === '') return new Paragraph({ text: '', spacing: { before: 200 } });
      return new Paragraph({
        children: [
          new TextRun({ text: line.label + ': ', bold: true, size: 20 }),
          new TextRun({ text: line.value, size: 20 })
        ],
        spacing: { after: 120 }
      });
    });
  }

  /**
   * Build copyright footer.
   * @returns {Object} Footer configuration
   */
  function buildFooterConfig() {
    return {
      default: new docx.Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: COPYRIGHT, italics: true, size: 16, color: COLOR_GREY })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Page ', size: 16, color: COLOR_GREY }),
              new TextRun({ children: [docx.PageNumber.CURRENT], size: 16, color: COLOR_GREY }),
              new TextRun({ text: ' of ', size: 16, color: COLOR_GREY }),
              new TextRun({ children: [docx.PageNumber.TOTAL_PAGES], size: 16, color: COLOR_GREY })
            ],
            alignment: AlignmentType.CENTER
          })
        ]
      })
    };
  }

  /**
   * Generate and trigger download of a .docx file.
   * @param {Document} doc - docx Document instance
   * @param {string} filename - Output filename
   */
  function triggerDownload(doc, filename) {
    Packer.toBlob(doc).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  /**
   * Helper: build a bold-label + value paragraph.
   * @param {string} label
   * @param {string} value
   * @returns {Paragraph}
   */
  function buildLabelValue(label, value) {
    return new Paragraph({
      children: [
        new TextRun({ text: label + ': ', bold: true, size: 20, color: COLOR_DARK_PLUM }),
        new TextRun({ text: value || '', size: 20 })
      ],
      spacing: { after: 140 },
      indent: { left: 120 }
    });
  }

  /**
   * Helper: build a section heading.
   * @param {string} title
   * @param {string} [source]
   * @returns {Paragraph[]}
   */
  function buildSectionHeading(title, source) {
    var paragraphs = [
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 28,
            color: COLOR_PLUM,
            font: 'Arial'
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 120 },
        border: {
          bottom: { color: COLOR_PLUM, space: 1, style: BorderStyle.SINGLE, size: 2 }
        }
      })
    ];
    if (source) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: 'Source: ' + source, italics: true, size: 18, color: COLOR_GREY })],
        spacing: { after: 180 }
      }));
    }
    return paragraphs;
  }

  // Expose API
  window.AEGISForms = {
    buildTitle: buildTitle,
    buildHeader: buildHeader,
    buildTable: buildTable,
    buildCheckboxList: buildCheckboxList,
    buildVersionHistory: buildVersionHistory,
    buildSignoff: buildSignoff,
    buildFooterConfig: buildFooterConfig,
    triggerDownload: triggerDownload,
    buildLabelValue: buildLabelValue,
    buildSectionHeading: buildSectionHeading
  };
})();
