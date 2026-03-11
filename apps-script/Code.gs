// ============================================================
// Harris School Digest — Google Apps Script
// Gmail → Gemini API → Supabase pipeline
// ============================================================

const CONFIG = {
  GEMINI_API_KEY:        PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  SUPABASE_URL:          PropertiesService.getScriptProperties().getProperty('SUPABASE_URL'),
  SUPABASE_SERVICE_KEY:  PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_KEY'),
  DRIVE_FOLDER_NAME:     'School Email PDFs',
  PROCESSED_LABEL:       'school-digest-processed',
  // Matches school emails by subject keywords OR sender domain
  // Subject keywords catch most school emails
  // bromcomcloud.com searches the email body (works even when forwarded)
  SEARCH_QUERY:          'subject:beckenham OR subject:harris OR subject:"primary academy" OR subject:bromcomcloud OR bromcomcloud.com'
};

// ============================================================
// ENTRY POINT — runs daily at 5pm, weekdays only
// ============================================================
function processNewSchoolEmails() {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return; // Skip weekends
  processEmails_(50);
}

// ============================================================
// MANUAL BULK BACKFILL — run once to catch all historical emails
// No weekday guard, processes up to 200 threads
// ============================================================
function processAllSchoolEmails() {
  processEmails_(200);
}

// ============================================================
// SHARED PROCESSING LOGIC
// ============================================================
function processEmails_(limit) {
  const label   = getOrCreateLabel(CONFIG.PROCESSED_LABEL);
  const threads = GmailApp.search(CONFIG.SEARCH_QUERY + ' -label:' + CONFIG.PROCESSED_LABEL, 0, limit);

  Logger.log('Found ' + threads.length + ' unprocessed thread(s)');

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      try {
        processMessage(message);
        thread.addLabel(label);
      } catch (e) {
        Logger.log('Error processing message [' + message.getId() + ']: ' + e.toString());
        // Do NOT apply label — will retry on next run
      }
    });
  });
}

// ============================================================
// PROCESS A SINGLE EMAIL
// ============================================================
function processMessage(message) {
  const gmailId   = message.getId();
  const date      = message.getDate();
  const emailBody = message.getPlainBody();

  // Extract original sender + subject from forwarded email body
  const forwarded = extractForwardedInfo(emailBody);
  const subject   = forwarded.subject || message.getSubject().replace(/^(fwd?:|fw:)\s*/i, '').trim();
  const sender    = forwarded.sender  || message.getFrom();

  // Check for duplicate (already in DB)
  const existing = supabaseRequest('GET',
    '/rest/v1/email_summaries?gmail_message_id=eq.' + gmailId + '&select=id'
  );
  if (existing.length > 0) {
    Logger.log('Already processed: ' + gmailId);
    return;
  }

  // Handle PDF attachment
  let pdfText      = '';
  let pdfDriveUrl  = null;
  let pdfFilename  = null;

  const attachments  = message.getAttachments();
  Logger.log('Attachments: ' + attachments.map(a => a.getName() + ' [' + a.getContentType() + ']').join(', ') || 'none');
  const pdfAttachment = attachments.find(a =>
    a.getContentType() === 'application/pdf' ||
    a.getContentType() === 'application/octet-stream' ||
    a.getName().toLowerCase().endsWith('.pdf')
  );

  if (pdfAttachment) {
    pdfFilename  = pdfAttachment.getName();
    pdfDriveUrl  = uploadPdfToDrive(pdfAttachment);
    pdfText      = extractTextFromPdf(pdfAttachment);
  }

  // Fetch existing upcoming events for deduplication context
  const existingEvents = fetchUpcomingEvents();

  // Call Gemini
  const claudeResult = callGeminiApi(emailBody, pdfText, subject, existingEvents);

  // Write email summary to Supabase
  const emailId = writeEmailSummary({
    gmail_message_id: gmailId,
    date_received:    date.toISOString(),
    subject,
    sender,
    summary:          claudeResult.summary,
    tags:             claudeResult.tags,
    has_attachment:   !!pdfAttachment,
    pdf_filename:     pdfFilename,
    pdf_drive_url:    pdfDriveUrl
  });

  // Write calendar events with deduplication
  claudeResult.events.forEach(event => {
    upsertCalendarEvent(event, emailId);
  });

  Logger.log('Processed: ' + subject + ' → emailId: ' + emailId);
}

// ============================================================
// UPLOAD PDF TO GOOGLE DRIVE
// ============================================================
function uploadPdfToDrive(attachment) {
  const folder = getOrCreateFolder(CONFIG.DRIVE_FOLDER_NAME);
  const blob   = attachment.copyBlob();
  const file   = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/file/d/' + file.getId() + '/view';
}

// ============================================================
// EXTRACT TEXT FROM PDF USING DRIVE OCR
// Requires Drive API enabled in Services
// ============================================================
function extractTextFromPdf(attachment) {
  try {
    const blob     = attachment.copyBlob().setContentType('application/pdf');
    const resource = { name: 'temp_ocr_' + Date.now(), mimeType: 'application/vnd.google-apps.document' };
    const file     = Drive.Files.create(resource, blob, { ocrLanguage: 'en' });
    const doc      = DocumentApp.openById(file.id);
    const text     = doc.getBody().getText();
    DriveApp.getFileById(file.id).setTrashed(true);
    return text;
  } catch (e) {
    Logger.log('PDF extraction failed: ' + e.toString());
    return '';
  }
}

// ============================================================
// GEMINI API — unified summarisation + event extraction
// Free tier: 1,500 requests/day via Google AI Studio
// ============================================================
function callGeminiApi(emailBody, pdfText, subject, existingEvents) {
  const existingEventsList = existingEvents
    .map(e => e.event_date + ': ' + e.title)
    .join('\n');

  const prompt = `You are processing a school newsletter email for Harris Primary Academy Beckenham.
Extract a plain-English summary and any calendar events with specific dates.

EMAIL SUBJECT: ${subject}

EMAIL BODY:
${emailBody}

${pdfText ? 'PDF ATTACHMENT CONTENT:\n' + pdfText : 'No PDF attachment.'}

EXISTING UPCOMING EVENTS (do not duplicate these):
${existingEventsList || 'None yet'}

Return ONLY a JSON object with this exact structure:
{
  "summary": "2-4 sentence plain English summary combining email and PDF content. Focus on what parents need to know.",
  "tags": ["Sport", "Deadline"],
  "events": [
    {
      "event_date": "YYYY-MM-DD",
      "title": "Short event title",
      "description": "One sentence of context",
      "event_type": "Deadline|Event|Reminder|Closure|Finance|General|Sport|Community",
      "action_text": "Plain English: what the parent needs to do or know"
    }
  ]
}

Tags must be from: Sport, Deadline, Community, Finance, Closure, General.
Only include events that have a specific date. Omit undated general information.
Do NOT include events already in the existing events list above.
If there are no datable events, return an empty array for events.
Return only valid JSON. No markdown, no code fences, no explanation.`;

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + CONFIG.GEMINI_API_KEY;

  const response = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192 }
    }),
    muteHttpExceptions: true
  });

  const json = JSON.parse(response.getContentText());

  if (json.error) {
    throw new Error('Gemini API error: ' + JSON.stringify(json.error));
  }

  const raw = json.candidates[0].content.parts[0].text.trim();
  // Strip markdown code fences Gemini sometimes adds despite instructions
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Gemini response: ' + raw);
  return JSON.parse(jsonMatch[0]);
}

// ============================================================
// WRITE EMAIL SUMMARY TO SUPABASE
// Returns the new row's UUID
// ============================================================
function writeEmailSummary(data) {
  const result = supabaseRequest('POST', '/rest/v1/email_summaries', data);
  if (!result || !result[0]) {
    throw new Error('Failed to insert email summary');
  }
  return result[0].id;
}

// ============================================================
// FETCH UPCOMING EVENTS FOR DEDUPLICATION CONTEXT
// ============================================================
function fetchUpcomingEvents() {
  const today = new Date().toISOString().split('T')[0];
  const result = supabaseRequest('GET',
    '/rest/v1/calendar_events?event_date=gte.' + today +
    '&order=event_date.asc&limit=50&select=event_date,title'
  );
  return result || [];
}

// ============================================================
// UPSERT CALENDAR EVENT WITH DEDUPLICATION
// ============================================================
function upsertCalendarEvent(event, emailId) {
  // Sanitise event_type — default to General if Gemini returns unexpected value
  const VALID_TYPES = ['Deadline', 'Event', 'Reminder', 'Closure', 'Finance', 'General', 'Sport', 'Community'];
  if (!VALID_TYPES.includes(event.event_type)) {
    Logger.log('Invalid event_type "' + event.event_type + '" — defaulting to General');
    event.event_type = 'General';
  }

  // Check for existing event on same date with similar title
  const titlePrefix = encodeURIComponent(event.title.substring(0, 20));
  const existing = supabaseRequest('GET',
    '/rest/v1/calendar_events?event_date=eq.' + event.event_date +
    '&title=ilike.*' + titlePrefix + '*&select=id,source_email_ids'
  );

  if (existing && existing.length > 0) {
    // Update existing — append email ID, update last_mentioned
    const current    = existing[0];
    const updatedIds = [...new Set([...(current.source_email_ids || []), emailId])];
    supabaseRequest('PATCH',
      '/rest/v1/calendar_events?id=eq.' + current.id,
      { source_email_ids: updatedIds, last_mentioned: new Date().toISOString() }
    );
    Logger.log('Updated existing event: ' + event.title);
  } else {
    // Insert new
    supabaseRequest('POST', '/rest/v1/calendar_events', {
      ...event,
      source_email_ids: [emailId],
      first_seen:       new Date().toISOString(),
      last_mentioned:   new Date().toISOString()
    });
    Logger.log('Inserted new event: ' + event.title);
  }
}

// ============================================================
// SUPABASE HTTP HELPER
// ============================================================
function supabaseRequest(method, path, body) {
  const options = {
    method,
    headers: {
      'apikey':        CONFIG.SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_SERVICE_KEY,
      'Content-Type':  'application/json',
      'Prefer':        method === 'POST' ? 'return=representation' : ''
    },
    muteHttpExceptions: true
  };

  if (body) options.payload = JSON.stringify(body);

  const res  = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + path, options);
  const text = res.getContentText();

  if (!text || text === '') return [];

  const parsed = JSON.parse(text);

  // Supabase error object
  if (parsed && parsed.code && parsed.message) {
    throw new Error('Supabase error [' + parsed.code + ']: ' + parsed.message);
  }

  return parsed;
}

// ============================================================
// EXTRACT ORIGINAL SENDER + SUBJECT FROM FORWARDED EMAIL
// Handles Gmail, Hotmail (underscores), and Outlook formats
// ============================================================
function extractForwardedInfo(emailBody) {
  // Split on common forward separators:
  // Gmail:   "---------- Forwarded message ---------"
  // Hotmail: "________________________________" (underscores)
  // Outlook: "-----Original Message-----"
  const parts = emailBody.split(
    /(?:-{4,}[^\n]*(?:forwarded|original)[^\n]*-{4,}|_{10,})/i
  );

  // Use the section immediately after the separator
  const headers = parts.length > 1 ? parts[1] : '';

  const fromMatch    = headers.match(/From:\s*([^\n\r]+)/i);
  const subjectMatch = headers.match(/Subject:\s*([^\n\r]+)/i);

  return {
    sender:  fromMatch    ? fromMatch[1].trim()    : null,
    subject: subjectMatch ? subjectMatch[1].trim() : null
  };
}

// ============================================================
// GMAIL LABEL HELPER
// ============================================================
function getOrCreateLabel(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

// ============================================================
// GOOGLE DRIVE FOLDER HELPER
// ============================================================
function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}
