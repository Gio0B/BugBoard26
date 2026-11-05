# BugBoard26

BugBoard26 è una piattaforma web collaborativa per gestire issue, commenti e allegati. Offre autenticazione JWT, ruoli `ADMIN` e `USER`, filtri e ordinamento, archiviazione logica e una dashboard React responsive.

## Funzionalità principali

- autenticazione con JWT e limitazione dei tentativi di login;
- creazione utenti riservata agli amministratori;
- issue di tipo `QUESTION`, `BUG`, `DOCUMENTATION` e `FEATURE`;
- priorità, stati, paginazione, filtri e ordinamento;
- fino a 5 immagini per issue, validate dal backend;
- commenti cronologici e archivio dedicato;
- migrazioni SQL e seed dimostrativo idempotente;
- health check applicativo e del database;
- test unitari Node.js e test d'integrazione JUnit 5.

## Stack

| Livello | Tecnologie |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router |
| Backend | Node.js 24, Express 5, Zod, JWT, bcrypt, PostgreSQL |
| Test | Node.js Test Runner, Java 21, Maven, JUnit 5 |
| Esecuzione | Docker e Docker Compose |

## Prerequisiti

Per l'avvio consigliato servono:

- Docker Desktop oppure Docker Engine con Compose v2;
- due database PostgreSQL distinti e raggiungibili tramite TLS: uno applicativo e uno riservato ai test;
- Git per clonare il repository.

Node.js, Java e Maven non sono necessari sull'host quando si usa Docker.

## Configurazione

1. Copiare il file di esempio:

   ```powershell
   Copy-Item .env.example .env
   ```

   Su macOS o Linux:

   ```bash
   cp .env.example .env
   ```

2. Modificare `.env` e impostare almeno:

   | Variabile | Descrizione |
   |---|---|
   | `DATABASE_URL` | URL PostgreSQL dell'applicazione |
   | `TEST_DATABASE_URL` | URL di un database separato, usato e azzerato dai test |
   | `JWT_SECRET` | segreto applicativo di almeno 32 caratteri |
   | `TEST_JWT_SECRET` | segreto distinto per l'ambiente di test |
   | `DEMO_ADMIN_PASSWORD` | password dell'utente dimostrativo amministratore |
   | `DEMO_USER_PASSWORD` | password dell'utente dimostrativo standard |
   | `API_BASE_URL` | URL pubblico dell'API letto dal frontend |
   | `CORS_ORIGIN` | origine autorizzata del frontend |

   `DATABASE_URL` e `TEST_DATABASE_URL` devono identificare database differenti. La suite d'integrazione elimina intenzionalmente lo schema `public` del solo database di test.

3. Non aggiungere mai `.env` a Git. Il file è già escluso da `.gitignore`.

## Avvio con Docker

Dalla cartella principale del progetto:

```powershell
docker compose up --build -d
```

Servizi disponibili:

- frontend: `http://localhost:8080`;
- API: `http://localhost:3000/api`;
- health check: `http://localhost:3000/api/health`.

Comandi utili:

```powershell
docker compose ps
docker compose logs -f backend
docker compose down
```

All'avvio il backend verifica la connessione, applica le migrazioni, esegue il seed e avvia l'API. Il seed crea due utenti dimostrativi, dieci issue e sei commenti senza duplicare i dati alle esecuzioni successive.

## Test e verifiche

### Controlli locali rapidi

Con Node.js 24 installato:

```powershell
npm --prefix backend ci
npm --prefix frontend ci
./scripts/docker/Test-LocalChecks.ps1
```

Lo script verifica la sintassi del backend, esegue i test unitari e crea la build di produzione del frontend. Per includere anche gli audit delle dipendenze:

```powershell
./scripts/docker/Test-LocalChecks.ps1 -IncludeAudit
```

Comandi equivalenti eseguibili singolarmente:

```powershell
npm --prefix backend run check
npm --prefix backend run test:unit
npm --prefix backend run test:coverage
npm --prefix frontend run build
```

### Test d'integrazione

I test d'integrazione usano il backend reale e il database indicato da `TEST_DATABASE_URL`:

```powershell
./scripts/docker/Run-IntegrationTests.ps1
```

Lo script abilita temporaneamente la guardia di reset, ricrea l'ambiente di test, esegue la suite JUnit e rimuove container e volumi di test al termine. Il reset viene rifiutato se i due URL identificano lo stesso database.

## API principali

| Metodo | Endpoint | Accesso |
|---|---|---|
| `POST` | `/api/auth/login` | pubblico |
| `POST` | `/api/users` | amministratore |
| `POST` | `/api/issues` | autenticato |
| `GET` | `/api/issues` | autenticato |
| `GET` | `/api/issues/:id` | autenticato |
| `GET` | `/api/issues/:id/images/:imageId` | autenticato |
| `PATCH` | `/api/issues/:id/status` | autenticato |
| `PATCH` | `/api/issues/:id/archive` | amministratore |
| `GET` | `/api/issues/archived` | autenticato |
| `POST`, `GET` | `/api/issues/:id/comments` | autenticato |
| `GET` | `/api/health` | pubblico |

La specifica completa è disponibile in `documentation-workspace/api/openapi.yaml`.

## Struttura del progetto

```text
backend/                  API, dominio, persistenza, migrazioni e seed
frontend/                 client React e configurazione Nginx
tests/junit/              test HTTP end-to-end
documentation-workspace/ OpenAPI, diagrammi e sorgenti della documentazione
docs/BugBoard26.pdf       documento tecnico
scripts/                  controlli locali, qualità e packaging
```

## CI e sicurezza

La workflow in `.github/workflows/ci.yml` esegue test unitari, controllo sintattico del backend e build del frontend su ogni push e pull request verso `main`.

I test d'integrazione, che azzerano il database dedicato, e l'analisi SonarQube si avviano manualmente dalla scheda **Actions**. Per la suite d'integrazione, configurare in **Settings > Secrets and variables > Actions**:

- `DATABASE_URL`
- `TEST_DATABASE_URL`
- `JWT_SECRET`
- `TEST_JWT_SECRET`
- `DEMO_ADMIN_PASSWORD`
- `DEMO_USER_PASSWORD`

Non inserire credenziali nei file versionati, nei log o nelle issue. Le variabili contenute in `.env.example` sono esclusivamente segnaposto; i valori reali devono restare in `.env` o nei secret del servizio di CI.

Per segnalare una vulnerabilità, seguire la [policy di sicurezza](.github/SECURITY.md). Per il repository pubblico è inoltre consigliato proteggere il branch `main`, richiedere la workflow CI prima del merge e abilitare gli avvisi sulle dipendenze.

## Risoluzione dei problemi

- **Configurazione non valida:** confrontare `.env` con `.env.example` e sostituire tutti i segnaposto.
- **Health check 503:** verificare URL, certificato TLS e disponibilità del database.
- **Checksum migrazione diverso:** non modificare una migrazione già applicata; crearne una nuova.
- **Reset test rifiutato:** controllare `ALLOW_TEST_DB_RESET` e assicurarsi che i due database siano distinti.
- **CORS:** impostare in `CORS_ORIGIN` l'origine esatta del frontend; più origini vanno separate da virgole.
- **Porta occupata:** modificare `BACKEND_PORT` o `FRONTEND_PORT` in `.env`.

## Licenza

MIT, vedere `LICENSE`.
