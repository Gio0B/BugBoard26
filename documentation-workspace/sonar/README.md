# Analisi qualità del back-end

## Stato verificabile

La configurazione SonarQube è circoscritta a `backend/`. Lo snapshot più recente è in [`backend-quality-report.md`](backend-quality-report.md) ed è generato dalle API del server dopo aver atteso il completamento del task di analisi. Comprende Quality Gate, metriche Sonar, problemi con file e riga, copertura LCOV dei test unitari e audit npm delle dipendenze runtime; va rigenerato dopo modifiche al codice per aggiornare le metriche.

La CI del 7 ottobre 2026 aveva già completato scanner ed elaborazione con `ANALYSIS SUCCESSFUL` e `EXECUTION SUCCESS`; il report locale aggiunge metriche persistenti e riproducibili che il server effimero della CI non conservava.

## Esecuzione

La procedura raccomandata genera anche la copertura LCOV e salva le metriche in `backend-quality-report.md`:

```powershell
.\scripts\quality\New-BackendQualityReport.ps1
```

Lo script riusa un SonarQube già attivo oppure lo avvia tramite Compose, crea e revoca un token temporaneo, esegue i quattro test unitari, importa `backend/lcov.info`, attende l'elaborazione e interroga le API per Quality Gate, metriche e problemi. Il dashboard rimane su `http://localhost:9000`; `-StopAfter` ferma soltanto il servizio avviato dallo script.

Il token non deve essere scritto in `.env.example`, nei log condivisi o nella cronologia Git. Il profilo usa immagini versionate; la proprietà `sonar.sources` impedisce l'analisi accidentale di front-end, test Java e documentazione.

## Controlli già eseguibili senza SonarQube

- parsing sintattico di tutti i file JavaScript del back-end;
- build di produzione Vite;
- parsing di Compose e OpenAPI;
- `npm audit --omit=dev` per le dipendenze runtime;
- scansione testuale di pattern tipici di segreti.

Questi controlli affiancano l'analisi SonarQube e restano riproducibili senza il server.

## Correzioni statiche applicate

Una revisione manuale precedente alla consegna ha eliminato la duplicazione nella costruzione delle pagine di issue, reso espliciti gli invarianti dell'entità `Issue` e uniformato il `requestId` anche sugli errori interni. Sono interventi verificabili nel codice e distinti dall'esito dello scanner.
