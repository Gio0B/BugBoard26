# BugBoard26 — Decisioni architetturali

## Stato

Decisioni approvate per l'implementazione iniziale. Le versioni esatte delle
dipendenze saranno bloccate nei lockfile dopo la verifica dell'ambiente di
build. Ogni variazione sostanziale richiederà un nuovo ADR o una revisione
esplicita di questo documento.

## ADR-001 — Separazione client, API e persistenza

**Decisione:** adottare tre livelli distribuiti: client React, API REST
Express e Neon PostgreSQL. Il client comunica soltanto con l'API via HTTPS e
non possiede credenziali del database.

**Motivazione:** separa presentazione, logica applicativa e dati; permette di
avviare e distribuire frontend e backend indipendentemente; mantiene
autorizzazione e invarianti in un solo confine fidato.

**Conseguenze:** sono necessari contratti JSON versionabili, CORS configurato,
gestione coerente degli errori e configurazione runtime dell'URL API.

```text
Browser ──HTTP/JSON──> React/Nginx
   │
   └──────HTTP/JSON──> Express API ──TLS/PostgreSQL──> Neon
                              │
                              └── migrazioni e seed all'avvio
```

## ADR-002 — Organizzazione object-oriented del backend

**Decisione:** usare classi JavaScript moderne e dependency injection
esplicita per entity, repository, service e controller.

Responsabilità:

- **Entity:** rappresenta stato e invarianti del dominio senza conoscere HTTP
  o PostgreSQL.
- **Repository:** contiene SQL parametrizzato e mapping tra righe ed entità.
- **Service:** applica autorizzazioni di dominio, transazioni e casi d'uso.
- **Controller:** traduce richiesta/risposta e delega al service.
- **Route:** associa endpoint, validator e middleware.
- **DTO:** limita e stabilizza i dati in ingresso e in uscita.
- **Middleware:** gestisce autenticazione, ruolo, errori, request ID e aspetti
  HTTP trasversali.

**Motivazione:** rende le responsabilità esplicite e verificabili senza
forzare gerarchie artificiali. Le dipendenze vengono costruite in un
composition root, evitando singleton nascosti.

**Conseguenze:** più file e mapping espliciti, compensati da accoppiamento
ridotto e migliore manutenibilità.

## ADR-003 — Issue come entità principale

**Decisione:** `BUG` è un valore di `Issue.type`, non una sottoclasse.

**Motivazione:** QUESTION, BUG, DOCUMENTATION e FEATURE condividono campi,
ciclo di vita, commenti, filtri, autorizzazioni e persistenza. Una gerarchia
non introdurrebbe comportamento polimorfico utile e aumenterebbe la
complessità.

**Conseguenze:** il database usa un unico insieme di issue e un vincolo sul
tipo; nuove categorie compatibili potranno essere aggiunte con migrazione.

## ADR-004 — PostgreSQL Neon come unica persistenza

**Decisione:** usare il driver `pg`, `DATABASE_URL`, pool configurabile e SSL
compatibile con Neon. Nessun database locale o in memoria sostituirà Neon.

**Motivazione:** è un requisito esplicito e mantiene i test aderenti
all'ambiente reale.

**Conseguenze:** lo sviluppo offline non può verificare query o flussi end to
end. Saranno predisposti controlli di configurazione e messaggi diagnostici
chiari. Un branch/database Neon distinto, configurato con
`TEST_DATABASE_URL`, sarà obbligatorio per JUnit.

## ADR-005 — Migrazioni SQL versionate

**Decisione:** conservare script SQL ordinati in
`backend/database/migrations` e registrarli in `schema_migrations` con nome e
checksum. Il runner usa una connessione dedicata, transazioni quando
compatibili e un advisory lock.

**Motivazione:** lo schema deve essere riproducibile e verificabile senza
affidarsi a sincronizzazioni implicite di ORM.

**Conseguenze:** una migrazione applicata non viene modificata; le correzioni
sono nuove migrazioni. Un checksum diverso causa un arresto sicuro.

## ADR-006 — Seed dimostrativo idempotente

**Decisione:** utenti, 10 issue e commenti dimostrativi usano identificatori
stabili. Gli inserimenti sono transazionali e protetti da conflitto; nessun
dato estraneo viene cancellato.

Le password demo vengono lette da variabili d'ambiente e trasformate in hash
bcrypt soltanto nel processo backend. Il seed non stampa segreti.

**Motivazione:** riavvii e deployment ripetuti devono conservare esattamente
un insieme dimostrativo senza duplicazioni.

**Conseguenze:** modificare le credenziali d'ambiente dopo il primo seed non
ruota automaticamente una password esistente; la procedura di rotazione sarà
documentata separatamente.

## ADR-007 — Autenticazione JWT e autorizzazione server-side

**Decisione:** login email/password, bcrypt e JWT firmato con scadenza
configurabile. Il token contiene identificatore, ruolo e dati minimi.

Le route protette usano due middleware distinti:

1. autenticazione e caricamento del principal;
2. autorizzazione per ruolo quando richiesta.

**Motivazione:** il frontend può nascondere azioni non disponibili, ma solo
il backend costituisce il confine di sicurezza.

**Conseguenze:** non è previsto un sistema di revoca centralizzato nella
prima versione; token brevi e segreto forte riducono l'esposizione. Eventuali
refresh token sono fuori perimetro finché non richiesti.

## ADR-008 — Errori e validazione centralizzati

**Decisione:** validare body, query e path prima dei controller e usare classi
di errore applicative mappate centralmente a codici HTTP e codici stabili.

Formato:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "La risorsa richiesta non esiste.",
    "details": []
  }
}
```

**Motivazione:** evita risposte incoerenti e impedisce la fuoriuscita di stack
trace o dettagli SQL.

**Conseguenze:** i controller non decidono autonomamente la forma degli
errori. Gli errori inattesi ricevono un request ID correlabile ai log.

## ADR-009 — React, Tailwind e configurazione runtime

**Decisione:** usare React con Vite, JavaScript moderno e Tailwind CSS. Il
container Nginx genera `config.js` all'avvio con `API_BASE_URL`; il bundle non
incorpora URL Neon né segreti.

**Motivazione:** il medesimo artefatto frontend può essere usato in ambienti
diversi senza rebuild. Tailwind permette di esprimere token e layout Material
senza trasferire logica di business al client.

**Conseguenze:** il bootstrap deve verificare la configurazione pubblica. I
token JWT resteranno in memoria di sessione per la prima versione; non saranno
memorizzati in cookie o storage persistente senza una decisione di sicurezza
dedicata.

## ADR-010 — Material Design 3 Expressive

**Decisione:** applicare Material Design 3 Expressive mediante design token
propri, non tramite una copia del tema predefinito di una libreria.

Direzione visiva:

- indaco elettrico come colore primario e superfici fredde ad alto contrasto;
- forme arrotondate differenziate per stabilire gerarchia;
- tipografia flessibile ma leggibile, corpo minimo 16 px;
- movimento breve e funzionale, disattivabile con `prefers-reduced-motion`;
- touch target adeguati, focus visibile e stato non comunicato solo dal colore;
- layout list-detail per finestre espanse e navigazione compatta sui telefoni;
- azioni amministrative esplicite e conferma prima dell'archiviazione.

Riferimenti verificati il 30 settembre 2026:

- <https://m3.material.io/>
- <https://m3.material.io/foundations/>
- <https://m3.material.io/foundations/layout/canonical-examples/overview>

**Motivazione:** la versione corrente di Material privilegia prodotti
adattivi, accessibili ed espressivi. BugBoard26 resta uno strumento di lavoro:
l'espressività sostiene gerarchia e riconoscimento senza introdurre ornamenti
che rallentano il compito.

**Conseguenze:** componenti e stati saranno realizzati e documentati in modo
coerente nel codice React/Tailwind. I tre mock-up iniziali costituiscono la
baseline, non schermate eseguibili.

## ADR-011 — Container separati e avvio controllato

**Decisione:** due immagini applicative indipendenti e una rete Compose
dedicata. Il backend esegue: validazione ambiente, migrazioni, seed, avvio. Il
frontend dipende dalla disponibilità dell'API ma può essere eseguito con un
endpoint esterno.

**Motivazione:** rispetta la separazione richiesta e rende il percorso di
avvio riproducibile.

**Conseguenze:** Neon rimane esterno a Compose. Le immagini useranno build
multistadio, versioni bloccate e utenti non privilegiati. Il server chiuderà
HTTP e pool database su SIGTERM/SIGINT.

## ADR-012 — Test JUnit come black-box integration suite

**Decisione:** un progetto Maven separato invia richieste HTTP a un backend
containerizzato reale collegato al database Neon di test.

Non sono ammessi mock di HTTP, repository, autenticazione o database. Il
profilo di test applica migrazioni e seed reali e usa identificatori univoci.

**Motivazione:** valida il comportamento osservabile e la compatibilità tra
tutti i componenti richiesti.

**Conseguenze:** la suite non può essere dichiarata superata finché manca
`TEST_DATABASE_URL`. Un reset protetto e un controllo di non coincidenza con
`DATABASE_URL` riducono il rischio verso dati non di test.

## ADR-013 — Copertura e SonarQube

**Decisione:** analizzare con SonarQube il solo backend e separare le metriche
statiche dalla copertura. La suite JUnit è black-box e non strumenta il
processo Node: in questa versione la copertura viene quindi dichiarata non
disponibile, anziché introdurre test simulati o pubblicare percentuali non
dimostrabili.

**Motivazione:** affidabilità e trasparenza dei risultati hanno priorità su
una metrica artificiale. Bug, vulnerabilità, code smell e duplicazioni restano
misurabili eseguendo il profilo qualità versionato.

**Conseguenze:** una futura copertura richiederà un backend di test
strumentato e un arresto ordinato che produca LCOV durante gli stessi flussi
JUnit reali; questa estensione non è dichiarata completata.

## ADR-014 — Archivio logico e integrità storica

**Decisione:** archiviare significa aggiornare `Issue.archived` a `true`.
Utenti, issue e commenti hanno relazioni `ON DELETE RESTRICT`; l'API non offre
endpoint di eliminazione.

**Motivazione:** preserva riferimenti, discussioni e tracciabilità e soddisfa
il requisito di non cancellazione.

**Conseguenze:** una futura politica di retention richiederà una decisione e
una migrazione dedicate; non verrà introdotta implicitamente.

## ADR-015 — Strategia Git e collaborazione pubblica

**Decisione:** `main` contiene soltanto modifiche verificate. Lo sviluppo usa
branch brevi e pull request; ogni contributor configura localmente la propria
identità Git e usa credenziali personali, senza condividerle o versionarle.

**Motivazione:** mantenere attribuzione e revisione verificabili senza imporre
alias, remote o configurazioni locali specifiche.

**Conseguenze:** la CI valida ogni push e pull request verso `main`; i secret
necessari alle verifiche esterne restano nelle impostazioni protette di GitHub
Actions. I dettagli delle configurazioni Git personali non fanno parte della
documentazione pubblica.

## Rischi architetturali e stato

| Rischio | Stato | Mitigazione |
|---|---|---|
| Indisponibilità URL Neon | risolto nella CI | Due target reali distinti, segreti GitHub e guard esplicita. |
| Configurazione pubblica incompleta | mitigato | README, licenza, policy di sicurezza, CI e gestione dei secret sono versionati. |
| Configurazione test errata | mitigato e verificato | Confronto URL, guard esplicita e script con arresto sicuro. |
| Token nel browser | Esposizione in caso di XSS | CSP, testo non interpretato come HTML, token non persistente. |
| Migrazioni concorrenti | Schema parziale | Advisory lock e transazioni. |
| Liste crescenti | Query e UI lente | Paginazione, indici e limiti massimi. |
| UI troppo decorativa | Riduzione dell'efficienza | Usare M3 Expressive con gerarchia funzionale e protocollo di usabilità. |

## Criteri per riesaminare le decisioni

Un ADR viene riesaminato quando cambia un requisito, una verifica reale
contraddice un'assunzione, emerge un rischio di sicurezza o una dipendenza
scelta non supporta Docker/Neon. Le modifiche devono essere versionate e
collegate al commit che le implementa.
