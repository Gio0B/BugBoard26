# BugBoard26 — Analisi dei requisiti

## 1. Scopo e confini

BugBoard26 supporta un team software nella registrazione, consultazione,
discussione e archiviazione logica delle issue. La piattaforma è composta da
un client web React, un'API REST Express e un database Neon PostgreSQL. Il
browser non accede mai direttamente alla persistenza.

Il prodotto non sostituisce un sistema di project management generale: non
gestisce assegnatari, scadenze, allegati, notifiche, etichette personalizzate,
duplicati o report periodici.

## 2. Glossario essenziale

| Termine | Definizione |
|---|---|
| Issue | Unità di lavoro o discussione classificata come domanda, bug, documentazione o funzionalità. |
| Archivio | Vista separata delle issue escluse dalla lista operativa tramite cancellazione logica. |
| ADMIN | Utente autenticato abilitato anche a creare utenti e archiviare issue. |
| USER | Utente autenticato che può creare e consultare issue e commenti. |
| Seed | Inizializzazione ripetibile dei dati dimostrativi. |
| Migrazione | Modifica versionata e incrementale dello schema PostgreSQL. |

## 3. Attori e profili

### 3.1 Collaboratore — ruolo USER

- Conosce le nozioni fondamentali di un progetto software.
- Accede da browser desktop o mobile.
- Deve poter segnalare rapidamente una issue e fornire contesto tramite
  commenti.
- Può consultare e filtrare il lavoro del team.
- Non può creare account né archiviare issue.

### 3.2 Amministratore — ruolo ADMIN

- Possiede tutte le capacità del collaboratore.
- Crea gli account del team attribuendo il ruolo corretto.
- Decide quando una issue non deve più comparire nella lista operativa.
- Deve distinguere chiaramente le azioni amministrative da quelle ordinarie.

### 3.3 Sistema di esecuzione

Docker Compose avvia i componenti, controlla la configurazione, applica le
migrazioni e inizializza i dati dimostrativi prima di esporre l'applicazione.

## 4. Requisiti funzionali

### 4.1 Autenticazione e utenti

| ID | Requisito | Attore | Priorità | Verifica prevista |
|---|---|---|---|---|
| RF-AUT-01 | Il sistema consente il login con email e password. | USER, ADMIN | Must | JUnit HTTP: credenziali valide. |
| RF-AUT-02 | Il sistema rifiuta credenziali errate senza rivelare quale campo sia errato. | Pubblico | Must | JUnit HTTP: login non valido. |
| RF-AUT-03 | Il sistema restituisce un JWT con scadenza configurabile dopo un login valido. | USER, ADMIN | Must | Ispezione risposta e accesso protetto. |
| RF-AUT-04 | Gli endpoint riservati richiedono un JWT valido. | Sistema | Must | JUnit HTTP senza token/token non valido. |
| RF-USR-01 | Solo un ADMIN può creare un utente. | ADMIN | Must | JUnit HTTP per entrambi i ruoli. |
| RF-USR-02 | La creazione utente richiede email, password e ruolo validi. | ADMIN | Must | Casi validi, campi mancanti e valori non ammessi. |
| RF-USR-03 | Le email utente sono univoche senza distinzione tra maiuscole e minuscole. | Sistema | Must | Vincolo DB e risposta HTTP 409. |

### 4.2 Issue

| ID | Requisito | Attore | Priorità | Verifica prevista |
|---|---|---|---|---|
| RF-ISS-01 | Ogni utente autenticato può creare una issue. | USER, ADMIN | Must | JUnit HTTP con entrambi i ruoli. |
| RF-ISS-02 | Titolo, descrizione e tipo sono obbligatori. | USER, ADMIN | Must | Validazione del body. |
| RF-ISS-03 | Il tipo appartiene a QUESTION, BUG, DOCUMENTATION, FEATURE. | Sistema | Must | Classi di equivalenza valide/non valide. |
| RF-ISS-04 | Lo stato iniziale è TODO. | Sistema | Must | Risposta di creazione e lettura successiva. |
| RF-ISS-05 | La priorità appartiene a LOW, MEDIUM, HIGH, CRITICAL. | Sistema | Must | Validazione e vincolo DB. |
| RF-ISS-06 | La lista principale restituisce solo issue non archiviate. | USER, ADMIN | Must | Creazione, archiviazione e nuova lettura. |
| RF-ISS-07 | La lista mostra titolo, tipo, stato, priorità, autore e data. | USER, ADMIN | Must | Contratto JSON e vista UI. |
| RF-ISS-08 | La lista può essere filtrata per tipo, stato e priorità. | USER, ADMIN | Must | JUnit per ciascun filtro e combinazioni. |
| RF-ISS-09 | La lista può essere ordinata per data di creazione. | USER, ADMIN | Must | JUnit ascendente e discendente. |
| RF-ISS-10 | La lista può essere ordinata per priorità. | USER, ADMIN | Must | JUnit con ordinamento semantico. |
| RF-ISS-11 | Il dettaglio restituisce descrizione, metadati e autore. | USER, ADMIN | Must | Lettura per UUID valido e inesistente. |
| RF-ISS-12 | Liste e query applicano limiti ragionevoli e validati. | Sistema | Should | Test dei limiti e valori fuori intervallo. |
| RF-ISS-13 | Ogni utente autenticato può impostare una issue attiva nello stato `IN_PROGRESS`, indipendentemente dal ruolo. | USER, ADMIN | Must | JUnit HTTP per entrambi i ruoli e controllo UI. |

### 4.3 Commenti

| ID | Requisito | Attore | Priorità | Verifica prevista |
|---|---|---|---|---|
| RF-COM-01 | Ogni utente autenticato può aggiungere un commento a una issue esistente. | USER, ADMIN | Must | JUnit HTTP. |
| RF-COM-02 | Un commento contiene testo, autore, data e issue associata. | Sistema | Must | Contratto JSON e vincoli DB. |
| RF-COM-03 | Il dettaglio issue mostra i commenti in ordine cronologico. | USER, ADMIN | Must | API e UI. |
| RF-COM-04 | I commenti restano disponibili dopo l'archiviazione dell'issue. | Sistema | Must | JUnit post-archiviazione. |

### 4.4 Archiviazione

| ID | Requisito | Attore | Priorità | Verifica prevista |
|---|---|---|---|---|
| RF-ARC-01 | Solo un ADMIN può archiviare una issue. | ADMIN | Must | JUnit ADMIN/USER. |
| RF-ARC-02 | L'archiviazione imposta `archived = true` senza cancellare record. | Sistema | Must | API e query reale. |
| RF-ARC-03 | Le issue archiviate sono consultabili solo nella lista dedicata e nel dettaglio. | USER, ADMIN | Must | JUnit sui due endpoint di lista. |
| RF-ARC-04 | Archiviare una issue già archiviata è idempotente. | ADMIN | Should | Ripetizione PATCH senza duplicazioni. |

### 4.5 Sistema e inizializzazione

| ID | Requisito | Attore | Priorità | Verifica prevista |
|---|---|---|---|---|
| RF-SYS-01 | `/api/health` verifica processo e connettività essenziale al DB. | Sistema | Must | Health check Docker e risposta 503 al guasto. |
| RF-SYS-02 | Le migrazioni vengono applicate automaticamente prima dell'avvio. | Sistema | Must | Avvio su schema vuoto e riavvio. |
| RF-SYS-03 | Il seed crea 2 utenti, esattamente 10 issue dimostrative e commenti minimi. | Sistema | Must | Conteggio tramite API su database pulito. |
| RF-SYS-04 | Il seed è idempotente e non cancella dati esistenti. | Sistema | Must | Doppia esecuzione e confronto identificatori. |

## 5. Requisiti non funzionali

| ID | Categoria | Requisito e misura |
|---|---|---|
| RNF-SEC-01 | Sicurezza | Password archiviate soltanto come hash bcrypt con costo configurabile e minimo documentato. |
| RNF-SEC-02 | Sicurezza | Nessun segreto in sorgenti, immagini, log, PDF o cronologia Git. |
| RNF-SEC-03 | Sicurezza | Query parametrizzate e validazione centralizzata di body, query e path. |
| RNF-SEC-04 | Sicurezza | Header di sicurezza, CORS configurabile e rate limit sul login. |
| RNF-SEC-05 | Sicurezza | Messaggi di autenticazione non rivelatori; errori applicativi uniformi. |
| RNF-REL-01 | Affidabilità | Migrazioni e seed protetti da transazione e lock contro avvii concorrenti. |
| RNF-REL-02 | Affidabilità | Arresto ordinato: il server smette di accettare richieste e chiude il pool DB. |
| RNF-PORT-01 | Portabilità | Avvio principale mediante `docker compose up --build`. |
| RNF-PORT-02 | Portabilità | Backend e frontend avviabili e distribuibili separatamente. |
| RNF-PORT-03 | Portabilità | Immagini riproducibili, multistadio e con processo non privilegiato. |
| RNF-USA-01 | Usabilità | L'utente riconosce stato, priorità e tipo senza dipendere solo dal colore. |
| RNF-USA-02 | Usabilità | Interfaccia utilizzabile da tastiera, con focus visibile ed etichette accessibili. |
| RNF-USA-03 | Usabilità | Layout senza scorrimento orizzontale indesiderato da 320 px in su. |
| RNF-USA-04 | Usabilità | Stati di caricamento, errore, vuoto e successo sono espliciti. |
| RNF-PER-01 | Prestazioni | Liste paginate; query dei filtri sostenute da indici. |
| RNF-MAN-01 | Manutenibilità | Responsabilità separate in entity, repository, service, controller e route. |
| RNF-MAN-02 | Manutenibilità | Configurazione esterna e dipendenze bloccate tramite lockfile. |
| RNF-TEST-01 | Testabilità | Test JUnit 5 contro API, autenticazione, repository e Neon reali. |
| RNF-DOC-01 | Documentazione | Unico PDF finale in `/docs`; sorgenti fuori da tale cartella. |

## 6. Requisiti di dominio e regole

1. `Issue` è l'astrazione principale. Un bug non è una sottoclasse ma una
   issue con `type = BUG`, perché condivide ciclo di vita, autorizzazioni,
   commenti, persistenza e presentazione con gli altri tipi.
2. Un utente possiede esattamente un ruolo tra `ADMIN` e `USER`.
3. Una issue possiede esattamente un autore e non può esistere senza di esso.
4. Un commento appartiene a una sola issue e a un solo autore.
5. Utenti, issue e commenti non vengono eliminati dall'applicazione.
6. `archived` è indipendente da `status`: anche una issue non conclusa può
   diventare irrilevante e venire archiviata da un amministratore.
7. La priorità predefinita è `MEDIUM`; lo stato iniziale è sempre `TODO`.
8. Ogni utente autenticato può portare una issue attiva nello stato `IN_PROGRESS`.
9. Le date sono memorizzate in UTC e presentate nella lingua/fuso del browser.
10. L'ordinamento delle priorità è `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` in
   modalità discendente e l'inverso in modalità ascendente.
11. Il testo utente viene conservato come testo, mai interpretato come HTML.

## 7. Modello dati concettuale

### User

- `id`: UUID, chiave primaria;
- `email`: indirizzo normalizzato, univoco;
- `passwordHash`: hash bcrypt non serializzato nelle risposte;
- `role`: `ADMIN` o `USER`;
- `createdAt`: data di creazione.

### Issue

- `id`: UUID, chiave primaria;
- `title`, `description`;
- `type`, `priority`, `status`;
- `authorId`: chiave esterna obbligatoria verso User;
- `archived`: booleano non nullo, predefinito `false`;
- `createdAt`, `updatedAt`.

### Comment

- `id`: UUID, chiave primaria;
- `issueId`, `authorId`: chiavi esterne obbligatorie;
- `text`;
- `createdAt`.

Gli indici principali coprono archivio e data, tipo, stato, priorità e chiavi
esterne. Il comportamento `ON DELETE RESTRICT` impedisce di spezzare la
storia applicativa.

## 8. Contratti REST previsti

| Metodo e percorso | Accesso | Risultato principale |
|---|---|---|
| `POST /api/auth/login` | Pubblico, limitato | JWT e profilo minimo |
| `POST /api/users` | ADMIN | Utente creato senza hash |
| `POST /api/issues` | Autenticato | Issue creata |
| `GET /api/issues` | Autenticato | Pagina di issue attive filtrata/ordinata |
| `GET /api/issues/archived` | Autenticato | Pagina di issue archiviate |
| `GET /api/issues/:id` | Autenticato | Dettaglio issue |
| `PATCH /api/issues/:id/status` | Autenticato | Issue impostata `IN_PROGRESS` |
| `PATCH /api/issues/:id/archive` | ADMIN | Issue archiviata |
| `POST /api/issues/:id/comments` | Autenticato | Commento creato |
| `GET /api/issues/:id/comments` | Autenticato | Commenti della issue |
| `GET /api/health` | Pubblico | Stato applicazione e database |

Formato errore uniforme previsto:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "I dati inviati non sono validi.",
    "details": []
  }
}
```

I dettagli non devono contenere stack trace, query, credenziali o informazioni
che consentano l'enumerazione degli account.

## 9. Matrice di dipendenza

| Capacità | Dipende da |
|---|---|
| Login | Schema User, seed account, JWT, bcrypt |
| Creazione utenti | Login, middleware ruolo, transazione repository |
| Issue | Login, schema Issue, User esistente |
| Commenti | Login, Issue e User esistenti |
| Archivio | Login ADMIN, Issue esistente |
| Frontend | Contratti REST e configurazione runtime API |
| JUnit | Immagine backend, branch Neon test, migrazioni, seed |
| Sonar | Sorgenti backend e coverage prodotta dai test |
| PDF | Requisiti, UML, mock-up, report e guida operativa |

## 10. Assunzioni e vincoli aperti

- Il repository GitHub è pubblico e la CI è definita in `.github/workflows/ci.yml`.
- PlantUML è il tool CASE e Maven gestisce la suite JUnit 5.
- La UI segue Material Design 3 Expressive con un'impostazione professionale.
- Le credenziali demo sono configurate tramite variabili d'ambiente.
- `DATABASE_URL` e `TEST_DATABASE_URL` sono forniti soltanto a runtime e non
  vengono versionati; devono sempre identificare database distinti.
- Gli esiti aggiornati delle verifiche automatiche sono consultabili nella
  sezione Actions del repository e non vengono fissati in questo documento.

## 11. Criterio di accettazione globale

La consegna è completa soltanto quando il progetto si avvia con Docker,
l'health check conferma Neon, le 10 issue iniziali sono presenti senza
duplicati, i flussi UI funzionano, la suite JUnit passa sul database dedicato,
l'analisi qualità è documentata e il pacchetto finale supera la checklist di
segreti, cronologia e contenuti.
