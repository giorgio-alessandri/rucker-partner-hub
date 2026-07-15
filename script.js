const cfg = window.RUCKER_PORTAL_CONFIG;
const contactGrid = document.getElementById('contactGrid');

cfg.contacts.forEach((contact) => {
  const card = document.createElement('article');
  card.className = 'contact-card';
  card.innerHTML = `<div><div class="contact-icon">${contact.icon}</div><h3>${contact.area}</h3><p>${contact.description}</p></div><div class="contact-person"><strong>${contact.name}</strong><a href="mailto:${contact.email}">${contact.email}</a></div>`;
  contactGrid.appendChild(card);
});

const addEmail = document.getElementById('addEmail');
const emailList = document.getElementById('newsletterEmails');
addEmail.addEventListener('click', () => {
  const row = document.createElement('div');
  row.className = 'repeat-row';
  row.innerHTML = `<input name="newsletter_email" type="text" placeholder="email@azienda.it"><button type="button" class="icon-btn remove-email" aria-label="Rimuovi email">×</button>`;
  emailList.appendChild(row);
});
emailList.addEventListener('click', (event) => {
  if (event.target.classList.contains('remove-email') && emailList.children.length > 1) event.target.parentElement.remove();
});

document.querySelectorAll('.file-field input').forEach((input) => {
  input.addEventListener('change', () => {
    input.closest('.file-field').querySelector('em').textContent = input.files[0]?.name || 'Seleziona file';
  });
});

function fileToPayload(file, maxMb) {
  if (!file) return Promise.resolve(null);
  if (file.size > maxMb * 1024 * 1024) throw new Error(`Il file ${file.name} supera il limite di ${maxMb} MB.`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({name:file.name, mimeType:file.type || 'application/octet-stream', base64:String(reader.result).split(',')[1]});
    reader.onerror = () => reject(new Error(`Impossibile leggere ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

const form = document.getElementById('partnerForm');
const status = document.getElementById('formStatus');
const submitButton = document.getElementById('submitButton');
const successModal = document.getElementById('successModal');
const successEyebrow = document.getElementById('successEyebrow');
const successTitle = document.getElementById('successTitle');
const successBody = document.getElementById('successBody');

function openSuccess(eyebrow, titleHtml, bodyText) {
  successEyebrow.textContent = eyebrow;
  successTitle.innerHTML = titleHtml;
  successBody.textContent = bodyText;
  successModal.hidden = false;
}

document.getElementById('closeSuccess').addEventListener('click', () => { successModal.hidden = true; });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!cfg.appsScriptUrl || cfg.appsScriptUrl.includes('INCOLLA_QUI')) {
    status.textContent = 'Il portale è pronto, ma deve ancora essere collegato a Google Apps Script nel file config.js.';
    return;
  }
  if (!form.elements.logo_svg.files[0]) {
    status.textContent = 'Carica il logo vettoriale (.SVG) per completare l’invio.';
    form.elements.logo_svg.closest('.file-field').scrollIntoView({block:'center'});
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = 'Invio in corso…';
  status.textContent = 'Caricamento dei dati e dei materiali.';
  try {
    const data = new FormData(form);
    const payload = {
      formType: 'onboarding',
      company: data.get('company'), website: data.get('website') || '',
      marketingName: data.get('marketing_name'), marketingRole: data.get('marketing_role') || '',
      marketingEmail: data.get('marketing_email'), marketingPhone: data.get('marketing_phone') || '',
      newsletterEmails: [...form.querySelectorAll('[name="newsletter_email"]')].map(i => i.value.trim()).filter(Boolean),
      instagram: data.get('instagram') || '', linkedin: data.get('linkedin') || '',
      consent: data.get('consent') === 'on', source: window.location.href,
      logoSvg: await fileToPayload(form.elements.logo_svg.files[0], 5),
      brandGuidelines: await fileToPayload(form.elements.brand_guidelines.files[0], 10)
    };
    // text/plain evita il preflight CORS. Apps Script salva i dati e invia le notifiche.
    await fetch(cfg.appsScriptUrl, {method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload)});
    form.reset();
    document.querySelectorAll('.file-field em').forEach((el) => { el.textContent = el.closest('.file-field').querySelector('span').textContent.includes('Logo') ? 'Seleziona file SVG' : 'Seleziona PDF'; });
    while (emailList.children.length > 1) emailList.lastElementChild.remove();
    status.textContent = '';
    openSuccess('ONBOARDING COMPLETATO', 'Welcome to the<br>Rucker Family.', 'Abbiamo ricevuto correttamente le informazioni e i materiali. Il team Rucker vi contatterà se saranno necessari ulteriori dettagli.');
  } catch (error) {
    console.error(error);
    status.textContent = error.message || 'Si è verificato un errore. Riprova oppure contatta il team Rucker.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Invia informazioni';
  }
});

// --- Form LED bordocampo: solo email con allegati a Marco ---
const ledForm = document.getElementById('ledForm');
const ledStatus = document.getElementById('ledStatus');
const ledSubmit = document.getElementById('ledSubmit');
const ledDrop = document.getElementById('ledDrop');
const ledInput = ledForm.elements.led_files;
const LED_MAX_MB = 20;

function updateLedLabel() {
  const n = ledInput.files.length;
  ledDrop.querySelector('em').textContent = n === 0 ? 'Seleziona o trascina i file' : (n === 1 ? ledInput.files[0].name : `${n} file selezionati`);
}
['dragenter', 'dragover'].forEach((ev) => ledDrop.addEventListener(ev, (e) => { e.preventDefault(); ledDrop.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((ev) => ledDrop.addEventListener(ev, (e) => { e.preventDefault(); ledDrop.classList.remove('dragover'); }));
ledDrop.addEventListener('drop', (e) => { ledInput.files = e.dataTransfer.files; updateLedLabel(); });
ledInput.addEventListener('change', updateLedLabel);

ledForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!cfg.appsScriptUrl || cfg.appsScriptUrl.includes('INCOLLA_QUI')) {
    ledStatus.textContent = 'Il portale è pronto, ma deve ancora essere collegato a Google Apps Script nel file config.js.';
    return;
  }
  const files = [...ledInput.files];
  if (!files.length) { ledStatus.textContent = 'Aggiungi almeno un file.'; return; }
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > LED_MAX_MB * 1024 * 1024) { ledStatus.textContent = `I file superano il limite di ${LED_MAX_MB} MB totali. Usa un servizio di trasferimento e scrivi a marco@marcoguberti.com.`; return; }
  ledSubmit.disabled = true;
  ledSubmit.textContent = 'Invio in corso…';
  ledStatus.textContent = 'Caricamento dei materiali.';
  try {
    const data = new FormData(ledForm);
    const payload = {
      formType: 'led',
      sponsor: data.get('sponsor'),
      email: data.get('led_email'),
      source: window.location.href,
      files: await Promise.all(files.map((f) => fileToPayload(f, LED_MAX_MB)))
    };
    await fetch(cfg.appsScriptUrl, {method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload)});
    ledForm.reset();
    updateLedLabel();
    ledStatus.textContent = '';
    openSuccess('MATERIALI LED RICEVUTI', 'Grazie,<br>ci pensiamo noi.', 'Abbiamo inviato i materiali LED al team Rucker. Verrai ricontattato se serviranno modifiche o formati aggiuntivi.');
  } catch (error) {
    console.error(error);
    ledStatus.textContent = error.message || 'Si è verificato un errore. Riprova oppure scrivi a marco@marcoguberti.com.';
  } finally {
    ledSubmit.disabled = false;
    ledSubmit.textContent = 'Invia materiali LED';
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
