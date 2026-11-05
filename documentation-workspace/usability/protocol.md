# BugBoard26 — Protocollo di valutazione dell'usabilità

## 1. Stato del documento

Questo file definisce un protocollo da eseguire. Alla data di preparazione non
sono state svolte sessioni con partecipanti e non esistono risultati effettivi.
Le sezioni destinate ai risultati sono quindi marcate esplicitamente come
“da raccogliere”.

## 2. Obiettivo

Valutare se collaboratori e amministratori riescono a completare il flusso
principale senza assistenza, comprendendo filtri, priorità, commenti e
conseguenze dell'archiviazione.

Domande di ricerca:

1. Gli utenti individuano rapidamente l'azione primaria?
2. Comprendono la differenza tra stato, priorità, tipo e archivio?
3. Riconoscono gli errori e sanno come correggerli?
4. Un amministratore comprende che l'archiviazione non elimina i dati?
5. Il flusso è utilizzabile da tastiera e su viewport compatto?

## 3. Metodo

- Test moderato individuale, in presenza o videoconferenza.
- Metodo think-aloud senza suggerimenti sulla posizione dei controlli.
- Durata prevista: 20–30 minuti per partecipante.
- Registrazione di note e tempi solo con consenso.
- Dati raccolti anonimizzati con codici P01, P02, ecc.
- Nessuna credenziale personale; solo account dimostrativi.

## 4. Profili da reclutare

Questi sono profili obiettivo, non persone già coinvolte:

- 2–3 collaboratori software con esperienza variabile nei bug tracker;
- 1–2 amministratori o team lead abituati a gestire priorità e backlog;
- almeno una sessione esclusivamente da tastiera;
- quando possibile, una sessione su schermo compatto.

## 5. Ambiente e precondizioni

- Versione candidata avviata con Docker Compose.
- Database Neon di prova inizializzato con le 10 issue dimostrative.
- Account USER e ADMIN separati.
- Browser aggiornato, zoom al 100% all'inizio; successiva verifica al 200%.
- Nessun dato reale o riservato.

## 6. Scenario assegnato

> Fai parte del team di BugBoard26. Devi segnalare un problema importante,
> controllare le altre issue della stessa priorità e aggiungere una nota utile.
> In seguito assumerai il ruolo di amministratore per rimuovere la nuova issue
> dalla lista operativa senza perdere le informazioni raccolte.

## 7. Attività

| # | Attività | Criterio di successo | Dato osservato |
|---:|---|---|---|
| 1 | Effettuare il login come USER. | Dashboard raggiunta senza aiuto. | Esito, tempo, errori. |
| 2 | Creare una issue BUG con priorità HIGH. | Issue salvata in TODO. | Esito, esitazioni, correzioni. |
| 3 | Filtrare la lista per priorità HIGH. | Sono visibili solo issue HIGH attive. | Esito, tempo, comprensione. |
| 4 | Aprire l'issue appena creata. | Dettaglio corretto raggiunto. | Percorso scelto. |
| 5 | Aggiungere un commento. | Commento visibile con autore e data. | Errori e feedback percepito. |
| 6 | Tentare di individuare l'archiviazione come USER. | L'utente comprende di non avere il permesso. | Aspettativa dichiarata. |
| 7 | Accedere come ADMIN e archiviare l'issue. | Conferma compresa e issue archiviata. | Esito, tempo, esitazioni. |
| 8 | Ritrovare issue e commento nell'archivio. | Entrambi ancora disponibili. | Esito e comprensione finale. |

## 8. Checklist euristica

Scala: 0 nessun problema; 1 cosmetico; 2 minore; 3 maggiore; 4 bloccante.

| Euristica | Domanda di controllo |
|---|---|
| Visibilità dello stato | Caricamento, successo, errore e filtri attivi sono riconoscibili? |
| Corrispondenza col dominio | Lessico e valori riflettono il lavoro del team? |
| Controllo dell'utente | Modali e moduli possono essere annullati senza perdita involontaria? |
| Coerenza | Azioni e indicatori mantengono posizione e significato? |
| Prevenzione errori | I vincoli sono comunicati prima dell'invio? |
| Riconoscimento | Tipi, stati e priorità non richiedono memoria? |
| Efficienza | Filtri e azioni principali sono raggiungibili senza passaggi superflui? |
| Design essenziale | Le informazioni secondarie non competono con il compito? |
| Recupero dagli errori | Il messaggio spiega cosa è accaduto e come procedere? |
| Aiuto contestuale | Le azioni irreversibili o amministrative sono spiegate? |
| Accessibilità | Focus, nomi accessibili, contrasto e touch target sono adeguati? |
| Adattività | Il flusso funziona su viewport compatto, medio ed espanso? |

## 9. Metriche

- Tasso di completamento per attività.
- Tempo per attività, interpretato qualitativamente e non come gara.
- Numero di errori, ritorni e richieste d'aiuto.
- Single Ease Question, scala 1–7, dopo ciascuna attività chiave.
- System Usability Scale solo se il numero di partecipanti permette di
  descriverla correttamente, senza generalizzazioni statistiche improprie.
- Osservazioni verbali e punti di esitazione.

## 10. Survey finale

Valutare da 1 “per niente d'accordo” a 5 “completamente d'accordo”:

1. Ho capito dove creare una issue.
2. Tipo, stato e priorità erano facili da distinguere.
3. I filtri hanno prodotto il risultato che mi aspettavo.
4. Ho ricevuto feedback sufficiente dopo ogni azione.
5. Ho capito cosa sarebbe successo archiviando una issue.
6. Mi sentirei sicuro nell'usare BugBoard26 senza assistenza.

Domande aperte:

- Qual è stato il passaggio meno chiaro?
- Quale informazione mancava nel momento in cui serviva?
- Cosa cambieresti per velocizzare il tuo lavoro?

## 11. Modulo di osservazione

| Campo | Valore da raccogliere |
|---|---|
| Codice partecipante | Da compilare |
| Profilo | USER-like / ADMIN-like |
| Dispositivo e viewport | Da compilare |
| Attività completate | Da compilare |
| Tempi | Da compilare |
| Errori e recuperi | Da compilare |
| Richieste d'aiuto | Da compilare |
| Citazioni autorizzate | Da compilare |
| Gravità problemi | Da compilare |

## 12. Risultati

**Da raccogliere.** Non sono state ancora eseguite sessioni. Il PDF finale
riporterà questa condizione finché non verranno forniti dati osservati reali.

## 13. Gestione delle criticità

Ogni problema verrà registrato con evidenza, attività, frequenza osservata,
gravità, proposta e stato. Le modifiche saranno prioritarie quando impediscono
il completamento, causano perdita di dati, nascondono autorizzazioni o
compromettono l'accessibilità.
