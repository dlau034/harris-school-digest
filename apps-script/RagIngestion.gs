// ============================================================
// Harris School Digest — RAG Ingestion Functions
// Paste this into a new file in your Apps Script project
// ============================================================

const RAG_CONFIG = {
  EMBED_MODEL:        'text-embedding-004',
  MANUAL_PDF_FOLDER:  'RAG Manual PDFs',   // Create this folder in Google Drive
  CHUNK_SIZE:         500,                 // characters per chunk
  CHUNK_OVERLAP:      60,                  // overlap between chunks
};

// Pages to scrape — ordered by parent relevance
const WEBSITE_PAGES = [
  // Parent Hub (highest value)
  { url: 'https://www.harrisprimarybeckenham.org.uk/156/parent-hub',                           label: 'School Website – Parent Hub' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/144/academy-term-dates',                   label: 'School Website – Term Dates' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/145/wrap-around-care',                     label: 'School Website – Wrap-Around Care' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/154/clubs',                                label: 'School Website – After-School Clubs' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/124/announcements',                        label: 'School Website – Announcements' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/126/newsletters-and-parent-communication', label: 'School Website – Newsletters' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/474/parent-pay',                           label: 'School Website – ParentPay' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/473/my-child-at-school',                   label: 'School Website – My Child At School' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/496/support',                              label: 'School Website – Support' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/360/online-safety',                        label: 'School Website – Online Safety' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/160/pta-happy-bees-friends-of-hpabe',      label: 'School Website – PTA' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1448/open-days',                           label: 'School Website – Open Days' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/2378/our-academy-day',                     label: 'School Website – Academy Day' },
  // Year groups
  { url: 'https://www.harrisprimarybeckenham.org.uk/197/year-1',                               label: 'School Website – Year 1' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/228/year-2',                               label: 'School Website – Year 2' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/403/year-3',                               label: 'School Website – Year 3' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/570/year-4',                               label: 'School Website – Year 4' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1484/year-5',                              label: 'School Website – Year 5' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1485/year-6',                              label: 'School Website – Year 6' },
  // Curriculum & subjects
  { url: 'https://www.harrisprimarybeckenham.org.uk/120/curriculum',                           label: 'School Website – Curriculum' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects',                            label: 'School Website – Subjects' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/190/classes',                              label: 'School Website – Classes' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/135/teaching-learning',                    label: 'School Website – Teaching & Learning' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/2/art-and-design',   label: 'School Website – Art & Design' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/14/british-values',  label: 'School Website – British Values' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/15/computing',       label: 'School Website – Computing' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/19/design-and-technology', label: 'School Website – Design & Technology' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/3/english',          label: 'School Website – English' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/13/eyfs',            label: 'School Website – EYFS' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/20/geography',       label: 'School Website – Geography' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/21/history',         label: 'School Website – History' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/6/maths',            label: 'School Website – Maths' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/7/modern-foreign-language', label: 'School Website – Modern Foreign Language' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/8/music',            label: 'School Website – Music' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/10/pe',              label: 'School Website – PE' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/18/phonics-read-write-inc', label: 'School Website – Phonics' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/9/pshec',            label: 'School Website – PSHEC' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/11/re',              label: 'School Website – RE' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/12/science',         label: 'School Website – Science' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/1985/subjects/subject/17/wild-wood',       label: 'School Website – Wild Wood' },
  // School info
  { url: 'https://www.harrisprimarybeckenham.org.uk/',                                         label: 'School Website – Homepage' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/6/contact-us',                             label: 'School Website – Contact Us' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/129/our-uniform',                          label: 'School Website – Uniform Policy' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/131/key-information',                      label: 'School Website – Key Information' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/150/our-food-provisions',                  label: 'School Website – Food Provisions' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/589/milk-and-fruit-scheme',                label: 'School Website – Milk & Fruit Scheme' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/140/catering-information-and-useful-links',label: 'School Website – Catering Info' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/132/academy-admissions',                   label: 'School Website – Admissions' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/122/latest-news',                          label: 'School Website – Latest News' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/299/wild-wood-school',                     label: 'School Website – Wild Wood School' },
  // Welfare
  { url: 'https://www.harrisprimarybeckenham.org.uk/137/safeguarding',                         label: 'School Website – Safeguarding' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/138/student-welfare',                      label: 'School Website – Student Welfare' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/139/sen-disabilities',                     label: 'School Website – SEN & Disabilities' },
  // About
  { url: 'https://www.harrisprimarybeckenham.org.uk/116/welcome-from-the-head-of-academy',     label: 'School Website – Welcome from Head' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/82/harris-federation',                     label: 'School Website – Harris Federation' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/161/pupil-premium',                        label: 'School Website – Pupil Premium' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/159/ofsted',                               label: 'School Website – Ofsted' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/186/our-vision',                           label: 'School Website – Our Vision' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/157/our-staff',                            label: 'School Website – Our Staff' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/149/our-results',                          label: 'School Website – Our Results' },
  { url: 'https://www.harrisprimarybeckenham.org.uk/188/pupil-parliament',                     label: 'School Website – Pupil Parliament' },
  // Calendar (partial static data)
  { url: 'https://www.harrisprimarybeckenham.org.uk/123/full-calendar',                        label: 'School Website – Full Calendar' },
];

// ============================================================
// ONE-OFF: Scrape all website pages and embed into rag_documents
// Run manually from the Apps Script editor — no trigger needed
// Safe to re-run: deletes old website chunks first
// ============================================================
function scrapeAndEmbedWebsite() {
  Logger.log('=== Starting website scrape: ' + WEBSITE_PAGES.length + ' pages ===');

  // Delete all existing website chunks (clean slate)
  supabaseRequest('DELETE', '/rest/v1/rag_documents?source_type=eq.website');
  Logger.log('Cleared existing website chunks');

  let totalChunks = 0;
  let skipped = 0;

  WEBSITE_PAGES.forEach((page, i) => {
    try {
      Logger.log('[' + (i + 1) + '/' + WEBSITE_PAGES.length + '] Scraping: ' + page.label);

      // Fetch HTML
      const response = UrlFetchApp.fetch(page.url, { muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) {
        Logger.log('  ↳ Skipped (HTTP ' + response.getResponseCode() + ')');
        skipped++;
        return;
      }

      // Strip HTML → plain text
      const text = stripHtml_(response.getContentText());
      if (text.length < 100) {
        Logger.log('  ↳ Skipped (too little content: ' + text.length + ' chars)');
        skipped++;
        return;
      }

      // Chunk and embed
      const chunks = chunkText_(text);
      Logger.log('  ↳ ' + chunks.length + ' chunks');

      chunks.forEach((chunk, chunkIdx) => {
        const embedding = embedText_(chunk);
        if (!embedding) return;

        supabaseRequest('POST', '/rest/v1/rag_documents', {
          content:     chunk,
          embedding:   '[' + embedding.join(',') + ']',
          source_type: 'website',
          source_label: page.label,
          source_url:  page.url,
          chunk_index: chunkIdx,
        });
        totalChunks++;
      });

      // Be polite to the school server
      Utilities.sleep(1000);

    } catch (e) {
      Logger.log('  ↳ Error: ' + e.toString());
      skipped++;
    }
  });

  Logger.log('=== Website scrape complete: ' + totalChunks + ' chunks stored, ' + skipped + ' pages skipped ===');
}

// ============================================================
// CALLED FROM processMessage() in Code.gs — embeds a single email
// Add this call at the end of processMessage() after writeEmailSummary()
// ============================================================
function embedEmailContent(emailId, subject, sender, dateReceived, emailBody, pdfText) {
  const label = subject + ' · ' + new Date(dateReceived).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Combine email body and PDF text for embedding
  const fullContent = [
    'Subject: ' + subject,
    'From: ' + sender,
    emailBody,
    pdfText ? '\n[PDF Content]\n' + pdfText : ''
  ].join('\n').trim();

  const sourceType = pdfText ? 'pdf' : 'email';
  const chunks = chunkText_(fullContent);

  chunks.forEach((chunk, chunkIdx) => {
    try {
      const embedding = embedText_(chunk);
      if (!embedding) return;

      supabaseRequest('POST', '/rest/v1/rag_documents', {
        content:         chunk,
        embedding:       '[' + embedding.join(',') + ']',
        source_type:     sourceType,
        source_label:    (sourceType === 'pdf' ? 'PDF: ' : 'Newsletter: ') + label,
        source_email_id: emailId,
        chunk_index:     chunkIdx,
      });
    } catch (e) {
      Logger.log('Embedding chunk ' + chunkIdx + ' failed: ' + e.toString());
    }
  });

  Logger.log('Embedded ' + chunks.length + ' chunks for: ' + label);
}

// ============================================================
// ONE-OFF BACKFILL: Embed all existing emails already in Supabase
// Run manually once after deploying RAG feature
// ============================================================
function backfillEmailEmbeddings() {
  Logger.log('=== Starting email backfill ===');

  // Fetch all emails not yet embedded (no rag_documents entry)
  const emails = supabaseRequest('GET',
    '/rest/v1/email_summaries?select=id,subject,sender,date_received,body,pdf_filename&order=date_received.desc'
  ) || [];

  Logger.log('Found ' + emails.length + ' emails to backfill');

  emails.forEach((email, i) => {
    try {
      Logger.log('[' + (i + 1) + '/' + emails.length + '] ' + email.subject);

      // Check if already embedded
      const existing = supabaseRequest('GET',
        '/rest/v1/rag_documents?source_email_id=eq.' + email.id + '&limit=1&select=id'
      );
      if (existing && existing.length > 0) {
        Logger.log('  ↳ Already embedded, skipping');
        return;
      }

      embedEmailContent(email.id, email.subject, email.sender, email.date_received, email.body || '', '');

      // Respect Gemini free tier rate limit
      Utilities.sleep(500);
    } catch (e) {
      Logger.log('  ↳ Error: ' + e.toString());
    }
  });

  Logger.log('=== Backfill complete ===');
}

// ============================================================
// DAILY: Watch "RAG Manual PDFs" Drive folder for new PDFs
// Add a daily trigger for this function (runs alongside email pipeline)
// ============================================================
function processManualPdfs() {
  const folder = getOrCreateFolder(RAG_CONFIG.MANUAL_PDF_FOLDER);
  const files = folder.getFiles();
  let processed = 0;

  while (files.hasNext()) {
    const file = files.next();

    // Skip already-processed files (marked via file description)
    if (file.getDescription() === 'rag-processed') continue;

    // Only process PDFs
    if (file.getMimeType() !== 'application/pdf') continue;

    try {
      Logger.log('Processing manual PDF: ' + file.getName());

      // OCR via Drive API (same method as email attachments)
      const resource = { name: 'temp_ocr_manual_' + Date.now(), mimeType: 'application/vnd.google-apps.document' };
      const ocrFile  = Drive.Files.create(resource, file.getBlob(), { ocrLanguage: 'en' });
      const doc      = DocumentApp.openById(ocrFile.id);
      const text     = doc.getBody().getText();
      DriveApp.getFileById(ocrFile.id).setTrashed(true);

      if (text.length < 50) {
        Logger.log('  ↳ Too little text extracted, skipping');
        file.setDescription('rag-processed');
        continue;
      }

      // Delete any previous embeddings for this file (by label match)
      const label = 'Manual PDF: ' + file.getName();
      supabaseRequest('DELETE', '/rest/v1/rag_documents?source_label=eq.' + encodeURIComponent(label));

      // Chunk and embed
      const chunks = chunkText_(text);
      chunks.forEach((chunk, chunkIdx) => {
        const embedding = embedText_(chunk);
        if (!embedding) return;

        supabaseRequest('POST', '/rest/v1/rag_documents', {
          content:     chunk,
          embedding:   '[' + embedding.join(',') + ']',
          source_type: 'manual_pdf',
          source_label: label,
          source_url:  'https://drive.google.com/file/d/' + file.getId() + '/view',
          chunk_index: chunkIdx,
        });
      });

      // Mark as processed
      file.setDescription('rag-processed');
      processed++;
      Logger.log('  ↳ Embedded ' + chunks.length + ' chunks');

    } catch (e) {
      Logger.log('  ↳ Error: ' + e.toString());
    }
  }

  Logger.log('Manual PDFs processed: ' + processed);
}

// ============================================================
// HELPERS
// ============================================================

// Call Gemini text-embedding-004 → returns float array or null
function embedText_(text) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=' + CONFIG.GEMINI_API_KEY;

  const response = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text: text }] },
    }),
    muteHttpExceptions: true,
  });

  const json = JSON.parse(response.getContentText());
  if (json.error) {
    Logger.log('Embed error: ' + JSON.stringify(json.error));
    return null;
  }
  return json.embedding.values;
}

// Split text into overlapping chunks of ~CHUNK_SIZE characters
function chunkText_(text) {
  const size    = RAG_CONFIG.CHUNK_SIZE;
  const overlap = RAG_CONFIG.CHUNK_OVERLAP;
  const chunks  = [];

  // Split on paragraph breaks first for cleaner chunks
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 30);
  let current = '';

  paragraphs.forEach(para => {
    if ((current + '\n' + para).length > size) {
      if (current.length > 50) chunks.push(current.trim());
      // Keep overlap: last N chars of current chunk
      current = current.slice(-overlap) + '\n' + para;
    } else {
      current = current ? current + '\n' + para : para;
    }
  });

  if (current.trim().length > 50) chunks.push(current.trim());
  return chunks;
}

// Strip HTML tags and collapse whitespace
function stripHtml_(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
