/**
 * RUCKER PARTNER PORTAL — GOOGLE APPS SCRIPT
 * Proprietario consigliato: marketingrucker@gmail.com
 */
const SETTINGS = {
  SHEET_NAME: 'Sponsor Onboarding',
  ROOT_FOLDER_NAME: 'Rucker Partner Portal - Materiali Sponsor',
  NOTIFICATION_EMAILS: ['marco@marcoguberti.com', 'achiumenti@rucker.it'],
  LED_NOTIFICATION_EMAIL: 'marco@marcoguberti.com',
  SEND_CONFIRMATION_TO_SPONSOR: true
};

function doGet() {
  return ContentService.createTextOutput('Rucker Partner Portal API attiva.');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (data.formType === 'led') return handleLed_(data);
    return handleOnboarding_(data);
  } catch (error) {
    console.error(error);
    return json_({ok:false, error:error.message});
  }
}

function handleLed_(data) {
  if (!data.sponsor || !data.email || !data.files || !data.files.length) {
    throw new Error('Dati LED obbligatori mancanti.');
  }
  const attachments = data.files
    .filter(function(f){ return f && f.base64; })
    .map(function(f){ return Utilities.newBlob(Utilities.base64Decode(f.base64), f.mimeType || 'application/octet-stream', f.name); });
  const timestamp = new Date();
  const body = [
    'Nuovo invio materiali LED bordocampo.', '',
    'SPONSOR: ' + data.sponsor,
    'Email referente: ' + data.email,
    'File allegati: ' + attachments.length, '',
    'Data invio: ' + Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
    'Pagina di origine: ' + (data.source || '-')
  ].join('\n');
  MailApp.sendEmail({
    to: SETTINGS.LED_NOTIFICATION_EMAIL,
    replyTo: data.email,
    subject: 'Materiali LED Rucker - ' + data.sponsor,
    body: body,
    name: 'Rucker Partner Portal',
    attachments: attachments
  });
  return json_({ok:true});
}

function handleOnboarding_(data) {
  try {
    validateData_(data);

    const spreadsheet = getOrCreateSpreadsheet_();
    const sheet = getOrCreateSheet_(spreadsheet);
    const rootFolder = getOrCreateFolder_(SETTINGS.ROOT_FOLDER_NAME);
    const companyFolder = getOrCreateFolder_(sanitizeName_(data.company), rootFolder);

    const logoUrl = saveFile_(data.logoSvg, companyFolder);
    const guidelinesUrl = saveFile_(data.brandGuidelines, companyFolder);
    const timestamp = new Date();

    sheet.appendRow([
      timestamp, data.company, data.website || '', data.marketingName,
      data.marketingRole || '', data.marketingEmail, data.marketingPhone || '',
      (data.newsletterEmails || []).join(', '), data.instagram || '', data.linkedin || '',
      logoUrl, guidelinesUrl, data.source || ''
    ]);

    sendInternalNotification_(data, logoUrl, guidelinesUrl, timestamp);
    if (SETTINGS.SEND_CONFIRMATION_TO_SPONSOR) sendSponsorConfirmation_(data);

    return json_({ok:true});
  } catch (error) {
    console.error(error);
    return json_({ok:false, error:error.message});
  }
}

function validateData_(data) {
  if (!data.company || !data.marketingName || !data.marketingEmail || !data.logoSvg) {
    throw new Error('Dati obbligatori mancanti.');
  }
}

function getOrCreateSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const file = SpreadsheetApp.create('Rucker Partner CRM');
  props.setProperty('SPREADSHEET_ID', file.getId());
  return file;
}

function getOrCreateSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SETTINGS.SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SETTINGS.SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Data invio','Nome azienda','Sito web','Referente marketing','Ruolo','Email referente','Telefono','Email newsletter','Instagram','LinkedIn','Logo SVG','Brand guidelines','Pagina di origine']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,13).setFontWeight('bold').setBackground('#ffe500');
    sheet.autoResizeColumns(1,13);
  }
  return sheet;
}

function getOrCreateFolder_(name, parent) {
  const iterator = parent ? parent.getFoldersByName(name) : DriveApp.getFoldersByName(name);
  if (iterator.hasNext()) return iterator.next();
  return parent ? parent.createFolder(name) : DriveApp.createFolder(name);
}

function saveFile_(fileData, folder) {
  if (!fileData || !fileData.base64) return '';
  const bytes = Utilities.base64Decode(fileData.base64);
  const blob = Utilities.newBlob(bytes, fileData.mimeType, fileData.name);
  const file = folder.createFile(blob);
  return file.getUrl();
}

function sendInternalNotification_(data, logoUrl, guidelinesUrl, timestamp) {
  const subject = `Nuovo Partner Onboarding | ${data.company}`;
  const body = [
    `È stato completato un nuovo onboarding partner.`, '',
    `AZIENDA: ${data.company}`,
    `Sito: ${data.website || '-'}`, '',
    `REFERENTE MARKETING`,
    `Nome: ${data.marketingName}`,
    `Ruolo: ${data.marketingRole || '-'}`,
    `Email: ${data.marketingEmail}`,
    `Telefono: ${data.marketingPhone || '-'}`, '',
    `EMAIL NEWSLETTER: ${(data.newsletterEmails || []).join(', ') || '-'}`,
    `Instagram: ${data.instagram || '-'}`,
    `LinkedIn: ${data.linkedin || '-'}`, '',
    `Logo SVG: ${logoUrl || '-'}`,
    `Brand Guidelines: ${guidelinesUrl || '-'}`, '',
    `Data invio: ${Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm')}`
  ].join('\n');
  MailApp.sendEmail({to: SETTINGS.NOTIFICATION_EMAILS.join(','), subject, body, name:'Rucker Partner Portal'});
}

function sendSponsorConfirmation_(data) {
  const subject = 'Abbiamo ricevuto i tuoi materiali | Rucker';
  const body = `Ciao ${data.marketingName},\n\ngrazie per aver completato il Rucker Partner Portal.\n\nAbbiamo ricevuto correttamente le informazioni e i materiali di ${data.company}. Il team Rucker ti contatterà qualora fossero necessari ulteriori dettagli.\n\nCi vediamo in Arena.\n\nTeam Rucker`;
  MailApp.sendEmail({to:data.marketingEmail, subject, body, name:'Rucker'});
}

function sanitizeName_(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, '-').trim();
}

function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}
