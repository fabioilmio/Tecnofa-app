# TECNOFA — Architettura gestionale e logica operativa

## 1. Principio generale

TECNOFA deve funzionare come una catena di dati collegati, non come una raccolta di pagine isolate.

```text
CLIENTE
  └─ SEDI
      └─ IMPIANTI
          ├─ COMPONENTI
          ├─ CONTRATTI
          ├─ PIANI MANUTENZIONE
          ├─ TICKET / RICHIESTE
          ├─ APPUNTAMENTI
          └─ INTERVENTI
              ├─ ORE / TRASFERTE
              ├─ MATERIALI
              ├─ MISURE / CHECKLIST
              ├─ FOTO / ALLEGATI
              ├─ DOCUMENTI
              ├─ FIRMA
              └─ CONSUNTIVO
                    ├─ COSTI
                    ├─ RICAVI
                    └─ MAGAZZINO
```

## 2. Entità principali

- Cliente
- Sede / indirizzo operativo
- Impianto
- Componente
- Contratto
- Piano di manutenzione
- Ticket / richiesta
- Intervento
- Appuntamento
- Tecnico
- Articolo / materiale
- Movimento di magazzino
- Preventivo
- Commessa
- Documento
- Spesa
- Pagamento
- Scadenza
- Allegato
- Nota / attività

Ogni entità deve avere un ID stabile, data creazione, data ultima modifica, stato e riferimenti alle entità collegate quando applicabile.

## 3. Flusso completo assistenza

```text
RICHIESTA
   ↓
TICKET / CHIAMATA
   ↓
QUALIFICAZIONE
   ↓
CLIENTE + IMPIANTO
   ↓
PROGRAMMAZIONE
   ↓
APPUNTAMENTO
   ↓
ASSEGNazione TECNICO
   ↓
PARTENZA / VIAGGIO
   ↓
INTERVENTO IN CORSO
   ↓
DIAGNOSI
   ↓
LAVORAZIONE
   ↓
MATERIALI + ORE + TRASFERTA + FOTO
   ↓
ESITO
   ├─ RISOLTO
   ├─ NON RISOLTO
   ├─ IN ATTESA RICAMBI
   ├─ RICHIESTO PREVENTIVO
   └─ NECESSARIO NUOVO INTERVENTO
   ↓
CONTROLLO DATI OBBLIGATORI
   ↓
CONSUNTIVO
   ↓
RAPPORTINO
   ↓
FIRMA CLIENTE
   ↓
CHIUSURA
   ↓
DOCUMENTO / INVIO
   ↓
AGGIORNAMENTO STORICO + MANUTENZIONE + MAGAZZINO + ECONOMIA
```

## 4. Stati intervento

Gli stati non sono semplici etichette: determinano quali azioni sono consentite.

1. BOZZA — creato ma non ancora programmato
2. PROGRAMMATO — data/ora assegnate
3. ASSEGNATO — tecnico incaricato
4. CONFERMATO — appuntamento confermato
5. IN VIAGGIO — partenza registrata
6. IN CORSO — intervento aperto dal tecnico
7. SOSPESO — interrotto con motivazione
8. DA COMPLETARE — lavoro eseguito ma dati/documenti mancanti
9. IN ATTESA — ricambio, cliente, autorizzazione o altro
10. DA PREVENTIVARE — richiede offerta
11. COMPLETATO — lavoro concluso
12. DA VALIDARE — chiusura soggetta a controllo
13. CHIUSO — consuntivo definitivo
14. ANNULLATO — non eseguito, con motivazione
15. ARCHIVIATO — storico non operativo

## 5. Regole di modifica

### Prima della chiusura

L'intervento può essere modificato normalmente dal soggetto autorizzato.

### Dopo la chiusura

Non si deve sovrascrivere silenziosamente il dato storico.

Azione consigliata:

```text
CHIUSO
  ↓
RIAPRI
  ↓
motivo obbligatorio
  ↓
MODIFICA
  ↓
nuova validazione
  ↓
NUOVA CHIUSURA
```

Ogni riapertura deve registrare chi, quando e perché.

## 6. Eliminazione: non cancellare la storia operativa

Per gli interventi operativi usare preferibilmente **annullamento** o **archiviazione**, non cancellazione fisica.

```text
APERTO → ANNULLATO
CHIUSO → RIAPRI / ANNULLA CON AUTORIZZAZIONE
```

La cancellazione fisica deve essere riservata a errori amministrativi o dati di prova e richiedere autorizzazione.

## 7. Controlli alla chiusura

TECNOFA deve impedire una chiusura incompleta quando sono configurati campi obbligatori.

Checklist minima configurabile:

- cliente
- impianto
- motivazione
- descrizione lavoro
- esito
- data/ora
- ore lavoro
- viaggio
- materiali
- eventuali misure
- foto richieste
- firma cliente, se richiesta
- documento/rapportino
- eventuale importo
- prossima manutenzione, se prevista

Se manca un dato obbligatorio, mostrare l'errore e non chiudere.

## 8. Esiti che generano automaticamente altre attività

```text
RISOLTO
  → chiusura

NON RISOLTO
  → nuovo intervento / follow-up

ATTESA RICAMBIO
  → attività di approvvigionamento
  → stato intervento IN ATTESA

DA PREVENTIVARE
  → crea preventivo collegato

MANUTENZIONE FUTURA
  → aggiorna prossima scadenza

GARANZIA
  → causale economica = garanzia
```

## 9. Materiali e magazzino

Il materiale usato nell'intervento deve creare un movimento di magazzino.

```text
INTERVENTO
  ↓
materiale utilizzato
  ↓
MOVIMENTO USCITA
  ↓
MAGAZZINO -1
```

Se l'intervento viene annullato dopo aver scaricato il materiale:

```text
ANNULLAMENTO
  ↓
movimento di storno
  ↓
MAGAZZINO + quantità
```

Non modificare direttamente lo storico dei movimenti.

## 10. Preventivo collegato all'intervento

Un intervento può generare un preventivo.

```text
INTERVENTO
  ↓
DA PREVENTIVARE
  ↓
PREVENTIVO
  ├─ BOZZA
  ├─ INVIATO
  ├─ VISTO
  ├─ ACCETTATO
  ├─ RIFIUTATO
  └─ SCADUTO
          ↓
     ACCETTATO
          ↓
      COMMESSA / INTERVENTO
```

## 11. Agenda

Un appuntamento deve essere collegabile a:

- cliente
- sede
- impianto
- ticket
- intervento
- tecnico
- durata prevista
- posizione GPS
- priorità
- stato

La modifica della data/ora deve aggiornare l'agenda senza perdere lo storico dell'intervento.

## 12. Percorsi

La mappa deve leggere gli appuntamenti del giorno.

```text
AGENDA
  ↓
indirizzi GPS
  ↓
PERCORSO
  ↓
ordine tappe
  ↓
km + tempo
  ↓
NAVIGAZIONE
```

Se una tappa viene spostata, il percorso deve poter essere ricalcolato.

## 13. Storico e audit

Ogni modifica importante deve poter essere ricostruita:

```text
10:05 creato intervento
10:10 assegnato tecnico
13:42 aperto
14:55 modificati materiali
15:03 chiuso
15:05 inviato rapportino
16:20 riaperto — motivo: errore materiale
16:27 modificato
16:30 richiuso
```

Campi audit consigliati:

- createdAt
- createdBy
- updatedAt
- updatedBy
- closedAt
- closedBy
- reopenedAt
- reopenedBy
- reopenReason
- cancellationReason
- version

## 14. Permessi

Anche se TECNOFA nasce personale, la struttura deve essere pronta per più utenti.

Ruoli iniziali:

- OWNER
- ADMIN
- TECNICO
- AMMINISTRAZIONE
- LETTURA

Esempio:

```text
OWNER
  tutto

ADMIN
  gestione operativa

TECNICO
  propri appuntamenti
  propri interventi
  materiali
  rapportini

AMMINISTRAZIONE
  clienti
  documenti
  preventivi
  economia

LETTURA
  sola consultazione
```

## 15. Dashboard

La dashboard deve mostrare ciò che richiede un'azione, non solo numeri.

```text
OGGI
├─ interventi da fare
├─ interventi in ritardo
├─ interventi da chiudere
├─ rapportini da validare
├─ preventivi da seguire
├─ manutenzioni in scadenza
├─ ricambi da ordinare
└─ incassi / scadenze
```

## 16. Struttura tecnica consigliata

```text
src/
├── core/
│   ├── router.js
│   ├── store.js
│   ├── permissions.js
│   ├── validation.js
│   ├── audit.js
│   └── notifications.js
│
├── data/
│   ├── db.js
│   ├── migrations.js
│   └── seed.js
│
├── modules/
│   ├── clients/
│   ├── sites/
│   ├── plants/
│   ├── tickets/
│   ├── appointments/
│   ├── interventions/
│   ├── maintenance/
│   ├── quotes/
│   ├── warehouse/
│   ├── documents/
│   ├── finance/
│   ├── routes/
│   ├── energy/
│   └── ai/
│
└── ui/
    ├── components/
    ├── forms/
    ├── tables/
    └── modals/
```

## 17. Regola fondamentale

TECNOFA non deve permettere che una singola azione distrugga informazioni collegate.

Prima di modificare/eliminare un record verificare:

1. quali record dipendono da esso;
2. quali movimenti economici esistono;
3. quali documenti sono collegati;
4. quali interventi sono collegati;
5. quali scadenze devono essere ricalcolate;
6. se serve audit;
7. se l'azione deve diventare annullamento invece di cancellazione.

Questo documento è la specifica funzionale di riferimento per le prossime versioni dell'app.
