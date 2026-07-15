# Rucker Partner Hub

Versione pronta per:
- pubblicazione gratuita con GitHub Pages;
- raccolta dati in Google Sheets;
- caricamento logo SVG e brand guidelines in Google Drive;
- notifica automatica a `marco@marcoguberti.com` e `achiumenti@rucker.it`;
- email di conferma al referente dello sponsor.

Il portale ha **due form**, gestiti dallo stesso Google Apps Script:
- **Materiali LED** (sezione LED): lo sponsor indica nome ed email e carica i file (.jpg/.mp4/.zip, max 20 MB totali). Arriva una mail con oggetto `Materiali LED Rucker - [Nome Sponsor]` e i file in allegato a `marco@marcoguberti.com`. Nessun salvataggio su Sheet/Drive.
- **Onboarding partner** (sezione Onboarding): salva i dati nel Google Sheet e i materiali in Google Drive, con notifiche e conferma.

Lo smistamento avviene tramite il campo `formType` (`led` / `onboarding`) nel payload; il `doPost` chiama la funzione dedicata. Un solo URL `/exec` per entrambi.

## 1. Anteprima locale
Apri `index.html` con Chrome/Safari. Il form non invierà dati finché non viene inserito l'URL di Google Apps Script in `config.js`.

## 2. Configurare Google Apps Script
Accedi con `marketingrucker@gmail.com`.

1. Vai su Google Apps Script e crea un nuovo progetto chiamato **Rucker Partner Portal**.
2. Copia il contenuto di `google-apps-script/Code.gs` nel file `Code.gs` del progetto.
3. In **Impostazioni progetto**, imposta il fuso orario su `Europe/Rome`.
4. Clicca **Esegui** su una funzione qualsiasi una prima volta e autorizza accesso a Fogli, Drive e Gmail. Se serve, crea temporaneamente una funzione `setup(){ getOrCreateSpreadsheet_(); }`, eseguila e poi rimuovila.
5. Clicca **Distribuisci → Nuova distribuzione → App web**.
6. Imposta:
   - Esegui come: **Me / marketingrucker@gmail.com**
   - Chi ha accesso: **Chiunque**
7. Copia l'URL che termina con `/exec`.
8. Apri `config.js` e sostituisci `INCOLLA_QUI_URL_GOOGLE_APPS_SCRIPT` con quell'URL.

Al primo invio verranno creati automaticamente:
- Google Sheet **Rucker Partner CRM**;
- foglio **Sponsor Onboarding**;
- cartella Drive **Rucker Partner Portal - Materiali Sponsor**;
- una sottocartella per ogni azienda.

## 3. Pubblicare su GitHub Pages
1. Crea un repository, per esempio `rucker-partner-portal`.
2. Carica **il contenuto della cartella**, non la cartella esterna: `index.html`, `styles.css`, `script.js`, `config.js`, `assets/`.
3. Vai in **Settings → Pages**.
4. Source: **Deploy from a branch**.
5. Branch: `main`; folder: `/root`.
6. Salva e attendi la pubblicazione.

L'indirizzo sarà simile a:
`https://NOME-ACCOUNT.github.io/rucker-partner-portal/`

## 4. Modifiche rapide
- Referenti: `config.js`
- Testi e campi: `index.html`
- Grafica: `styles.css`
- Email notifiche: `google-apps-script/Code.gs`, voce `NOTIFICATION_EMAILS`

## Nota tecnica
Il browser invia i dati con `mode: no-cors`, necessario per il collegamento semplice a Google Apps Script da GitHub Pages. Il portale mostra la conferma dopo che la richiesta è stata consegnata al servizio Google. Per verificare l'intero flusso, effettuare un invio di prova e controllare Sheet, Drive e notifiche email.
