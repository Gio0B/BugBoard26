# Piano di test

## Test unitari backend

La suite `backend/test/unit/coreHelpers.test.js` contiene quattro test basati sul test runner integrato di Node.js. Verifica in isolamento paginazione e DTO delle issue, firme binarie degli allegati, normalizzazione dei nomi file e costruzione sicura delle immagini. Si esegue con `npm --prefix backend run test:unit`; il comando `npm --prefix backend run test:coverage` aggiunge il report di copertura.

## Test di integrazione JUnit 5

## Stato e ambiente

L'ultima esecuzione completa conservata è stata effettuata con Docker, Maven/Java e due target Neon distinti: Surefire riporta **21 test, 0 failure, 0 errori e 0 skipped**, con `BUILD SUCCESS`. La suite comprende anche il caso di avanzamento a `IN_PROGRESS` per USER e ADMIN; una nuova esecuzione completa richiede il profilo Docker/Neon.

Il profilo Compose azzera in modo protetto il solo schema di test, applica migrazioni e seed, avvia Express, ripete due volte il seed e avvia Maven. Le classi sono eseguite in ordine alfabetico; i dati mutabili usano indirizzi, titoli e testi univoci.

## Matrice di copertura

| Classe | Comportamenti |
|---|---|
| `AAuthenticationApiTest` | health, login valido/invalido, token obbligatorio, creazione utente ADMIN e diniego USER |
| `BIssueQueryApiTest` | 10 issue iniziali, creazione, lista attiva, filtri e ordinamenti |
| `CCommentArchiveApiTest` | creazione/lettura commenti, diniego e successo archivio, liste e conservazione |
| `DSeedIsolationApiTest` | database distinti, identificatori stabili e relazioni dopo seed ripetuto |

## Caso significativo T-01 — Login e sessione

- **Obiettivo:** verificare autenticazione reale e mancata enumerazione dell'account.
- **Endpoint:** `POST /api/auth/login`.
- **Parametri:** e-mail e password demo lette dall'ambiente.
- **Classi di equivalenza:** coppia valida; password errata; e-mail formalmente invalida; campo mancante.
- **Caso valido:** credenziali ADMIN → `200`, JWT non vuoto, ruolo `ADMIN`.
- **Casi non validi:** password errata → `401 AUTHENTICATION_REQUIRED`; schema errato → `400 VALIDATION_ERROR`.
- **Atteso:** nessun hash password nella risposta; endpoint protetto accetta il token e rifiuta l'assenza.
- **Ottenuto:** superato nella suite end-to-end su Neon dedicato.
- **Criterio di copertura:** decisioni successo/fallimento e confine pubblico/protetto.
- **Motivazione:** il login abilita ogni altro caso d'uso ed è il confine principale di sicurezza.

## Caso significativo T-02 — Filtri e ordinamento issue

- **Obiettivo:** dimostrare che i criteri sono applicati dal backend, non dalla sola UI.
- **Endpoint:** `GET /api/issues`.
- **Parametri:** `type`, `status`, `priority`, `sortBy`, `direction`, `limit`.
- **Classi di equivalenza:** valori enum ammessi; valore fuori enum; limite 1–100; limite fuori intervallo.
- **Casi validi:** `type=BUG`, `status=IN_PROGRESS`, `priority=CRITICAL`; ordinamento data asc/desc e priorità asc/desc.
- **Casi non validi:** enum sconosciuto o limite 0/101 → `400`.
- **Atteso:** ogni elemento rispetta il filtro; la priorità segue CRITICAL→HIGH→MEDIUM→LOW in discesa; nessuna issue archiviata.
- **Ottenuto:** superato nella suite end-to-end; filtri e ordinamenti verificati via API.
- **Criterio di copertura:** partizioni per ciascun filtro e direzioni dei due ordinamenti.
- **Motivazione:** è il comportamento centrale della vista riepilogativa.

## Caso significativo T-03 — Commento e conservazione

- **Obiettivo:** verificare relazione reale Comment–Issue–User e integrità dopo archivio.
- **Endpoint:** `POST/GET /api/issues/:id/comments`.
- **Parametri:** UUID issue e testo 1–5000 caratteri.
- **Classi di equivalenza:** issue attiva esistente; issue inesistente; issue archiviata; testo valido/vuoto/troppo lungo.
- **Caso valido:** testo univoco su issue attiva → `201`, poi presente in `GET` con autore e data.
- **Casi non validi:** UUID/schema errato → `400`; issue inesistente → `404`; nuova scrittura dopo archivio → `409`.
- **Atteso:** il commento creato prima dell'archivio resta leggibile.
- **Ottenuto:** superato; commento persistito e conservato dopo l'archiviazione.
- **Criterio di copertura:** creazione, lettura, vincolo di stato e conservazione storica.
- **Motivazione:** protegge il contesto collaborativo, principale valore dell'archiviazione logica.

## Caso significativo T-04 — Autorizzazione archivio

- **Obiettivo:** verificare enforcement server-side del ruolo.
- **Endpoint:** `PATCH /api/issues/:id/archive` e liste attiva/archiviata.
- **Parametri:** UUID di una issue isolata, JWT USER o ADMIN.
- **Classi di equivalenza:** ADMIN; USER; token assente; issue inesistente; issue già archiviata.
- **Caso valido:** ADMIN → `200`, `archived=true`, presenza soltanto nella lista dedicata.
- **Casi non validi:** USER → `403`; token assente → `401`; UUID inesistente → `404`.
- **Atteso:** nessuna DELETE; una ripetizione ADMIN resta idempotente.
- **Ottenuto:** superato; diniego USER e archiviazione ADMIN verificati server-side.
- **Criterio di copertura:** matrice ruolo × stato issue e separazione delle due liste.
- **Motivazione:** una semplice visibilità condizionale nel frontend non sarebbe una misura di sicurezza.

## Caso significativo T-05 — Avanzamento a In corso

- **Obiettivo:** verificare che ogni ruolo autenticato possa impostare una issue attiva come `IN_PROGRESS`.
- **Endpoint:** `PATCH /api/issues/:id/status`.
- **Parametri:** UUID issue, body `{ "status": "IN_PROGRESS" }`, JWT USER o ADMIN.
- **Classi di equivalenza:** USER; ADMIN; token assente; issue attiva; issue archiviata; stato non ammesso.
- **Caso valido:** USER e ADMIN → `200`, `status=IN_PROGRESS`.
- **Casi non validi:** token assente → `401`; stato diverso → `400`; issue archiviata → `409`.
- **Atteso:** il backend applica la stessa autorizzazione per entrambi i ruoli e la UI aggiorna subito lo stato.
- **Criterio di copertura:** matrice ruolo × stato issue.
- **Motivazione:** la regola deve essere applicata server-side, non soltanto rendendo visibile il pulsante.

## Caso significativo T-06 — Seed e isolamento

- **Obiettivo:** verificare bootstrap ripetibile senza compromettere dati applicativi.
- **Componenti:** reset guard, migration runner, seed runner, API reale.
- **Parametri:** `DATABASE_URL`, `TEST_DATABASE_URL`, `ALLOW_TEST_DB_RESET=true`.
- **Classi di equivalenza:** URL distinte; URL identiche; flag assente; ambiente non test.
- **Caso valido:** target distinti e flag esplicito → reset, migrazione, seed ripetuto con conteggi 2/10/6.
- **Casi non validi:** target coincidenti o configurazione incompleta → arresto prima di `DROP SCHEMA`.
- **Atteso:** 10 UUID seed noti risolvibili e sei relazioni commento invariate; dati JUnit aggiuntivi non cancellati dal seed.
- **Ottenuto:** superato; reset protetto, migrazioni e seed ripetuto hanno mantenuto i conteggi attesi.
- **Criterio di copertura:** guardie distruttive, idempotenza e integrità referenziale.
- **Motivazione:** è il rischio operativo più alto della suite end-to-end.

## Criterio finale

Un run è accettabile soltanto con exit code Maven zero, report Surefire completi e conferma che il target Neon è dedicato. Errori di configurazione non sono test “saltati”: devono fallire chiaramente.
