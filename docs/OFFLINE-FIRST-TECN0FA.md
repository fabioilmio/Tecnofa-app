# TECNOFA — Offline-first e sincronizzazione

## Obiettivo

TECNOFA deve rimanere completamente operativa durante un intervento anche senza rete. La connessione non deve essere un prerequisito per aprire agenda, cliente, impianto o intervento e per registrare lavoro, materiali, note, foto e firma.

## Modello operativo

```text
                 TECNOFA APP
                     |
              Local Data Layer
                     |
        +------------+------------+
        |                         |
   IndexedDB                 UI/compatibilità
   media + outbox             localStorage legacy
        |
   Sync Engine
        |
   quando online
        v
     API / D1
```

La fonte autorevole durante il lavoro offline è il dispositivo. La sincronizzazione remota è una fase successiva e non deve bloccare il lavoro locale.

## Stato visibile all'utente

La UI deve mostrare sempre:

- Online / Offline
- numero di modifiche in coda
- ultimo tentativo di sincronizzazione
- ultima sincronizzazione completata con data e ora
- eventuale errore di sincronizzazione
- pulsante `Sincronizza ora`

Il badge di connessione non deve fingere che una sincronizzazione sia avvenuta: `Online` indica la connettività del dispositivo; `Ultima sincronizzazione` indica invece una sincronizzazione realmente completata.

## Coda locale

Ogni modifica deve poter essere rappresentata come operazione idempotente:

```text
id operazione
entità
record id
operazione: create | update | delete
payload/versione
updatedAt
clientId/deviceId
status: pending | syncing | synced | conflict | error
```

Le operazioni non devono essere perse se l'app viene chiusa o il dispositivo perde la rete.

## Sincronizzazione futura

Quando D1 sarà ricostruito, il contratto dovrà essere:

1. il client scarica solo i dati necessari al tecnico;
2. il client registra localmente ogni modifica;
3. al ritorno online invia la coda in modo idempotente;
4. il server conferma ogni operazione;
5. il client marca l'operazione come sincronizzata;
6. il client scarica le modifiche remote successive all'ultima versione conosciuta;
7. in caso di conflitto non sovrascrive silenziosamente il lavoro del tecnico.

## Conflitti

Priorità proposta:

- dati modificati da un solo dispositivo: merge automatico;
- stesso campo modificato localmente e remotamente: `conflict` esplicito;
- firma, foto e documenti: mai sovrascrivere; creare versioni/elementi distinti;
- stato intervento: usare una macchina a stati e validazioni, non un semplice ultimo-salvataggio-vince.

## Ispirazione Unico³ Mobile

Unico³ Mobile è un riferimento utile per il flusso operativo: agenda del tecnico, dati impianto, storico interventi, consultazione articoli/magazzino, foto, documenti, firma, validazioni e modalità asincrona con sincronizzazione al ritorno della rete. La direzione TECNOFA deve però essere più moderna e trasparente sullo stato della sincronizzazione.

## Evoluzione prevista

### V1 Local-first
- dati locali
- PWA installabile
- offline reale
- backup/import locale
- foto in IndexedDB
- coda outbox
- indicatore sincronizzazione

### V2 Sync server
- API versionate
- D1 come database centrale
- autenticazione server
- sync incrementale
- conflitti
- log di sincronizzazione

### V3 Mobile tecnico
- agenda personale
- intervento a schermo pieno
- checklist
- QR/barcode
- materiali da furgone
- foto e firma
- GPS opzionale
- notifiche
- sincronizzazione automatica

## Regola architetturale

Non usare più un bridge globale che intercetta `window.save()` e copia indistintamente tutto verso il server. Ogni modulo deve passare da un data/repository layer esplicito. Il server verrà collegato solo quando il modello dati locale e i flussi saranno stabili.
