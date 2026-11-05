# BugBoard26 — Casi d'uso

## 1. Catalogo sintetico

| ID | Caso d'uso | Attore primario | Esito di successo |
|---|---|---|---|
| UC-01 | Autenticarsi | USER, ADMIN | Sessione autenticata con JWT valido |
| UC-02 | Creare un utente | ADMIN | Nuovo account persistito |
| UC-03 | Consultare le issue attive | USER, ADMIN | Elenco filtrato e ordinato |
| UC-04 | Creare una issue | USER, ADMIN | Issue TODO non archiviata |
| UC-05 | Aprire il dettaglio | USER, ADMIN | Dati e commenti visualizzati |
| UC-06 | Aggiungere un commento | USER, ADMIN | Commento associato e visibile |
| UC-07 | Archiviare una issue | ADMIN | Issue spostata nell'archivio logico |
| UC-08 | Consultare l'archivio | USER, ADMIN | Elenco delle issue archiviate |
| UC-09 | Verificare il servizio | Docker/operatore | Stato API e Neon disponibile |

## 2. Relazioni principali

- UC-02–UC-08 includono la verifica di una sessione valida.
- UC-07 estende UC-05 ed è disponibile soltanto al ruolo ADMIN.
- UC-06 parte normalmente da UC-05 ma resta un'operazione API autonoma.
- UC-03 e UC-08 condividono paginazione e presentazione ma usano insiemi
  disgiunti rispetto al flag `archived`.

## 3. UC-04 — Creare una issue

### Scheda Cockburn

| Campo | Specifica |
|---|---|
| Livello | Obiettivo utente |
| Portata | Sistema BugBoard26 |
| Attore primario | USER o ADMIN autenticato |
| Stakeholder | Autore: vuole registrare il problema; team: vuole dati leggibili; organizzazione: vuole tracciabilità. |
| Precondizioni | L'utente possiede un JWT valido e si trova nella piattaforma. |
| Garanzia minima | Nessuna issue incompleta viene salvata; l'utente conserva i valori digitati quando possibile. |
| Garanzia di successo | Esiste una nuova issue attribuita all'utente, in stato TODO e visibile nella lista attiva. |
| Trigger | L'utente seleziona “Nuova issue”. |

### Scenario principale di successo

1. Il sistema apre il modulo di creazione.
2. L'utente inserisce titolo e descrizione.
3. L'utente sceglie uno dei quattro tipi.
4. L'utente mantiene o modifica la priorità proposta.
5. L'utente invia il modulo.
6. Il client valida i campi per offrire feedback immediato.
7. Il backend autentica il richiedente e valida nuovamente il body.
8. Il service costruisce l'entità con stato TODO, autore corrente e
   `archived = false`.
9. Il repository inserisce la issue mediante query parametrizzata.
10. Il sistema restituisce HTTP 201 con la rappresentazione creata.
11. Il client comunica il successo e apre il dettaglio della issue.

### Estensioni

- **2a. Titolo vuoto o troppo lungo:** il sistema evidenzia il campo e non
  invia la richiesta.
- **3a. Tipo non selezionato:** il sistema richiede una scelta esplicita.
- **5a. Token scaduto:** il backend restituisce 401; il client conserva il
  contenuto temporaneo e richiede un nuovo login.
- **7a. Payload manomesso:** il backend restituisce 400 nel formato errore
  uniforme.
- **9a. Neon non disponibile:** la transazione non produce dati parziali; il
  backend restituisce 503 e registra un errore privo di segreti.
- **11a. Risposta persa dopo il salvataggio:** il client segnala l'incertezza
  e invita a controllare la lista, evitando un reinvio automatico cieco.

### Regole e dati

- Titolo, descrizione e tipo sono obbligatori.
- Tipo: QUESTION, BUG, DOCUMENTATION, FEATURE.
- Priorità: LOW, MEDIUM, HIGH, CRITICAL; valore predefinito MEDIUM.
- Stato e autore non sono selezionabili dal client.

### Mock-up collegato

`../mock-up/create-issue.svg`

## 4. UC-06 — Aggiungere un commento

### Scheda Cockburn

| Campo | Specifica |
|---|---|
| Livello | Obiettivo utente |
| Portata | Sistema BugBoard26 |
| Attore primario | USER o ADMIN autenticato |
| Stakeholder | Commentatore: vuole aggiungere contesto; autore issue: vuole comprendere l'evoluzione; team: vuole conservare la discussione. |
| Precondizioni | Sessione valida; issue esistente e leggibile. |
| Garanzia minima | Un testo vuoto o non valido non viene persistito. |
| Garanzia di successo | Il commento è associato a issue e autore e compare nel dettaglio. |
| Trigger | L'utente scrive nel campo commento e seleziona “Pubblica”. |

### Scenario principale di successo

1. Il sistema mostra il dettaglio e i commenti cronologici.
2. L'utente inserisce il testo del commento.
3. L'utente seleziona “Pubblica”.
4. Il client impedisce l'invio di testo vuoto.
5. Il backend autentica, valida l'UUID della issue e normalizza il testo.
6. Il service verifica che la issue esista.
7. Il repository inserisce il commento con autore e timestamp server.
8. Il sistema restituisce HTTP 201.
9. Il client aggiunge il commento alla discussione e conferma il successo.

### Estensioni

- **2a. Solo spazi:** il campo presenta un errore e mantiene il focus.
- **5a. UUID non valido:** risposta 400 uniforme.
- **6a. Issue inesistente:** risposta 404 senza inserimento.
- **6b. Issue archiviata:** i commenti restano leggibili, ma il sistema
  risponde 409 ai nuovi inserimenti per mantenere l'archivio in sola lettura.
- **7a. Errore DB:** risposta 503 e nessun commento fantasma nell'interfaccia.
- **9a. Connessione interrotta:** il testo resta nel campo per un nuovo invio
  esplicito.

### Regole e dati

- Il testo è obbligatorio e trattato esclusivamente come testo.
- Autore e data provengono dalla sessione e dal server.
- L'archiviazione della issue non elimina i commenti.

### Mock-up collegato

`../mock-up/add-comment.svg`

## 5. UC-07 — Archiviare una issue

### Scheda Cockburn

| Campo | Specifica |
|---|---|
| Livello | Obiettivo utente |
| Portata | Sistema BugBoard26 |
| Attore primario | ADMIN autenticato |
| Stakeholder | Amministratore: vuole ripulire la vista attiva; team: vuole conservare dati e commenti; organizzazione: vuole evitare cancellazioni irreversibili. |
| Precondizioni | Sessione ADMIN valida; issue esistente e non archiviata. |
| Garanzia minima | Nessun record viene cancellato. |
| Garanzia di successo | `archived` è true, l'issue scompare dalla lista attiva e compare nell'archivio. |
| Trigger | L'amministratore sceglie “Archivia” nel dettaglio issue. |

### Scenario principale di successo

1. Il sistema rende visibile l'azione solo al ruolo ADMIN.
2. L'amministratore seleziona “Archivia”.
3. Il sistema apre una finestra di conferma che identifica chiaramente la
   issue e spiega che dati e commenti resteranno disponibili.
4. L'amministratore conferma.
5. Il backend autentica il token e verifica il ruolo ADMIN.
6. Il service richiede al repository l'aggiornamento logico.
7. Il repository imposta `archived = true` e aggiorna `updated_at`.
8. Il backend restituisce HTTP 200 con la issue aggiornata.
9. Il client mostra la conferma e rimuove la issue dalla lista attiva.
10. La issue è consultabile nella pagina Archivio con i suoi commenti.

### Estensioni

- **2a. Utente USER:** l'azione non è mostrata; una richiesta costruita
  manualmente riceve comunque 403.
- **3a. Annullamento:** la finestra si chiude e non viene inviata alcuna
  richiesta.
- **5a. Token scaduto:** risposta 401 e nuova autenticazione.
- **6a. Issue inesistente:** risposta 404.
- **6b. Issue già archiviata:** risposta idempotente con stato archiviato.
- **7a. Errore DB:** risposta 503; l'interfaccia non rimuove la issue.

### Regole e dati

- Non viene eseguita alcuna `DELETE`.
- L'autorizzazione è applicata nel backend, non affidata alla visibilità UI.
- Commenti, autore e date originali restano invariati.

### Mock-up collegato

`../mock-up/archive-issue.svg`

## 6. Casi trasversali di errore

| Condizione | HTTP | Comportamento client |
|---|---:|---|
| Body/query/path non validi | 400 | Evidenzia il problema correggibile |
| Token assente o scaduto | 401 | Richiede autenticazione |
| Ruolo insufficiente | 403 | Comunica il divieto senza offrire retry |
| Risorsa inesistente | 404 | Mostra stato dedicato e ritorno alla lista |
| Conflitto email | 409 | Invita a usare un indirizzo diverso |
| Rate limit login | 429 | Indica attesa prima del nuovo tentativo |
| Neon indisponibile | 503 | Mantiene i dati locali e consente retry esplicito |

## 7. Tracciabilità

| Caso d'uso | Requisiti principali | Diagrammi previsti | Test principali |
|---|---|---|---|
| UC-01 | RF-AUT-01–04 | Sequence login | Login valido, invalido, senza token |
| UC-02 | RF-USR-01–03 | Use case, design class | ADMIN crea, USER riceve 403 |
| UC-03 | RF-ISS-06–10,12 | Use case, component | Filtri e sort |
| UC-04 | RF-ISS-01–05 | Sequence creazione issue | Creazione valida e body non valido |
| UC-06 | RF-COM-01–04 | Sequence commento | Creazione, lettura e persistenza |
| UC-07 | RF-ARC-01–04 | Sequence archivio | ADMIN, USER e lista dedicata |
| UC-09 | RF-SYS-01–04 | Deployment | Health, doppio seed e conteggio 10 |
