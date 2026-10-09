
class PdfError extends Error {}

async function pdfToText(buf) {
  if (!Buffer.isBuffer(buf) || buf.length === 0) throw new PdfError('No file received.');
  if (buf.subarray(0, 5).toString('latin1') !== '%PDF-') throw new PdfError('That file is not a PDF.');
  let raw;
  try {
    const { extractText } = await import('unpdf');
    ({ text: raw } = await extractText(new Uint8Array(buf), { mergePages: true }));
  } catch {
    throw new PdfError("Couldn't read that PDF. It may be damaged or password protected. Paste the text instead.");
  }
  const text = raw.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 40) {
    throw new PdfError('No text found in that PDF. It is probably a scan or an image. Paste the text instead.');
  }
  return text;
}

module.exports = { pdfToText, PdfError };
