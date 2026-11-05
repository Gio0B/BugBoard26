# Report qualità backend

Generato il **2026-11-03 00:02:18 +01:00** dal progetto corrente con SonarQube Community Build e copertura LCOV reale.

## Esito

| Indicatore | Valore |
|---|---:|
| Quality Gate | **OK** |
| Linee di codice | 1862 |
| Copertura | 12.0% |
| Duplicazione | 0.0% |
| Affidabilità | C |
| Sicurezza | A |
| Manutenibilità | A |
| Debito tecnico (minuti) | 0 |
| Bug | 2 |
| Vulnerabilità | 0 |
| Security hotspot | 0 |
| Code smell | 0 |

Copertura SonarQube: metrica combinata calcolata dal server sui file analizzati.

## Problemi rilevati nell'esecuzione conservata

| Gravità | Tipo | Posizione | Regola | Descrizione |
|---|---|---|---|---|
| MAJOR | BUG | src/server.js:49 | javascript:S9383 | Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. |
| MAJOR | BUG | src/server.js:54 | javascript:S9383 | Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator. |

Entrambe le segnalazioni sono risolte nel sorgente corrente rendendo esplicito con `void` l'avvio asincrono dell'arresto controllato. Le metriche sopra restano la fotografia dell'esecuzione indicata e saranno aggiornate alla prossima analisi SonarQube.

Il Quality Gate può risultare OK anche in presenza di problemi sul codice complessivo: il gate predefinito valuta soprattutto il nuovo codice.

## Test e dipendenze

- Test unitari Node.js: **4 eseguiti, 4 superati**.
- LCOV sull'intero backend/src, escluso src/server.js: **10.74% linee, 39.66% rami, 15.52% funzioni**.
- SonarQube importa `backend/lcov.info`; esclude dalla copertura `src/server.js`, `scripts/**` e `database/seeds/**`.
- Audit dipendenze runtime: **0 totali: 0 critiche, 0 alte, 0 moderate, 0 basse**.

## Riproduzione

Eseguire dalla radice del repository:

```powershell
.\scripts\quality\New-BackendQualityReport.ps1
```

Il dashboard resta disponibile su [http://localhost:9000](http://localhost:9000). Se lo script ha avviato SonarQube tramite Compose, -StopAfter lo ferma al termine.
Il token di analisi è temporaneo e viene revocato automaticamente.

## Ambito e limiti

SonarQube analizza `backend/src`, `backend/scripts` e `backend/database/seeds`. L'audit npm è riportato separatamente perché non fa parte del motore SonarQube. Il report fotografa il codice e le dipendenze presenti al momento dell'esecuzione.
