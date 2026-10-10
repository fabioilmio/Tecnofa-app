# TECNOFA V5 — Architettura gestionale

## Principio
TECNOFA è un sistema collegato: le sezioni non sono pagine isolate. Ogni informazione importante deve poter essere raggiunta dal record che la genera e da quelli collegati.

```text
CLIENTE
 ├─ Anagrafica / contatti / posizione
 ├─ Impianti
 │   ├─ dati tecnici / componenti / garanzia
 │   ├─ interventi
 │   ├─ manutenzioni
 │   ├─ documenti
 │   └─ storico
 ├─ Interventi
 │   ├─ agenda / tecnico / timer
 │   ├─ richiesta / diagnosi / lavoro
 │   ├─ misure / checklist
 │   ├─ materiali → movimento magazzino
 │   ├─ costi / consuntivo
 │   ├─ firma / rapportino
 │   └─ storico
 ├─ Preventivi
 ├─ Manutenzioni
 └─ Documenti
```

## Funzioni V5 implementate
- Schede cliente ramificate.
- Schede impianto ramificate.
- Scheda intervento completa e sempre riapribile dopo la creazione.
- Storico movimenti collegato a cliente, impianto e intervento.
- Timer lavoro intervento.
- Firma cliente su canvas.
- Rapportino stampabile/PDF tramite stampa del browser.
- Materiali scaricabili direttamente dall'intervento.
- Movimento di magazzino automatico per ogni scarico.
- Storico dei movimenti articolo.
- Preventivi collegati al cliente.
- Manutenzioni ricorrenti collegate a cliente e impianto.
- Documenti collegabili a cliente, impianto e intervento.
- Agenda collegabile alle attività.
- Backup JSON.

## Moduli
1. Dashboard
2. Agenda
3. Clienti
4. Impianti
5. Interventi
6. Manutenzioni
7. Preventivi
8. Magazzino
9. Economia
10. Documenti
11. Mappa & percorsi
12. Energia
13. TECNOFA AI
14. Impostazioni

## Regola delle schede
Ogni record importante deve avere:
1. dati principali;
2. dati tecnici/operativi;
3. elementi collegati;
4. storico movimenti;
5. azioni rapide;
6. stato e date;
7. documenti quando applicabile.

## Intervento
Campi principali:
- data, cliente, impianto, tipo, titolo/richiesta;
- stato, priorità, tecnico;
- ora inizio/fine, ore lavoro, km, tempo viaggio;
- numero rapportino;
- richiesta/sintomo, diagnosi, lavoro eseguito;
- misure/parametri, checklist;
- materiali, esito, note, follow-up;
- manodopera, materiali, trasferta, altri costi, totale;
- note amministrative;
- firma cliente.

### Stati
`bozza → programmato → assegnato → confermato → in viaggio → in corso → sospeso → da completare → in attesa → da preventivare → completato → da validare → chiuso`

`annullato` e `archiviato` sono stati terminali operativi. La storia non viene cancellata silenziosamente.

### Chiusura
Per lo stato `chiuso` vengono verificati almeno:
- cliente;
- titolo/richiesta;
- diagnosi oppure lavoro eseguito;
- esito;
- ore.

## Storico
Ogni operazione significativa registra:
- ID movimento;
- ID entità;
- tipo entità;
- azione;
- dettaglio;
- data/ora.

Lo storico è accessibile dalla Dashboard, dalla scheda cliente, dalla scheda impianto, dalla scheda intervento e dalle Impostazioni.

## Magazzino
Il flusso operativo è:

`Intervento → Materiale → Quantità → Scarico → Movimento → Aggiornamento giacenza → Costo intervento → Storico`

La quantità non può scendere sotto zero.

## Persistenza
La V5 utilizza `localStorage` con chiave `tecnofa_v5` e recupera automaticamente i dati disponibili delle versioni precedenti.

## Evoluzione successiva
1. IndexedDB.
2. Allegati e foto reali.
3. Generazione PDF nativa.
4. Calendario avanzato con drag&drop.
5. Movimenti di carico/scarico completi e barcode.
6. Autenticazione e database cloud.
7. Sincronizzazione offline/online.
8. Notifiche e scadenze automatiche.
9. Home Assistant / TECNOFA Energy.
10. Assistente AI operativo.
