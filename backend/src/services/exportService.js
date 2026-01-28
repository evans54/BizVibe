const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

const flattenObject = (obj, prefix = '', result = {}) => {
  Object.entries(obj || {}).forEach(([key, value]) => {
    const field = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value, field, result);
    } else {
      result[field] = Array.isArray(value) ? JSON.stringify(value) : value;
    }
  });
  return result;
};

const generateCsv = (report) => {
  const flattened = flattenObject(report.content);
  const parser = new Parser({ fields: Object.keys(flattened) });
  return parser.parse([flattened]);
};

const generatePdfBuffer = (report) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).text('BizVibe Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Type: ${report.report_type}`);
    doc.text(`Generated: ${new Date(report.created_at).toLocaleString()}`);
    doc.moveDown();

    const content = report.content || {};
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Business: ${content.business?.name || 'N/A'}`);
    doc.text(`Average Rating: ${content.reviews?.averageRating || 0}`);
    doc.text(`Total Reviews: ${content.reviews?.totalReviews || 0}`);
    doc.moveDown();

    if (content.keywords?.length) {
      doc.fontSize(14).text('Keyword Rankings', { underline: true });
      content.keywords.slice(0, 10).forEach((keyword) => {
        doc.fontSize(11).text(`- ${keyword.keyword}: ${keyword.last_rank || 'N/A'}`);
      });
      doc.moveDown();
    }

    if (content.suggestions?.length) {
      doc.fontSize(14).text('SEO Suggestions', { underline: true });
      content.suggestions.forEach((suggestion) => {
        doc.fontSize(11).text(`- ${suggestion.title}: ${suggestion.action}`);
      });
    }

    doc.end();
  });

module.exports = {
  generateCsv,
  generatePdfBuffer
};
