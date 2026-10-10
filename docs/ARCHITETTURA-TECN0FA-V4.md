# TECNOFA V4 — Architettura gestionale

## Principio
TECNOFA non tratta le sezioni come pagine isolate. Tutti i dati devono essere collegabili e navigabili in entrambe le direzioni.

```text
CLIENTE
  ├─ Sedi / contatti
  ├─ Impianti
  │    ├─ dati tecnici
  │    ├─ interventi
  │    ├─ manutenzioni
  │    ├─ documenti
  │    └─ storico
  ├─ Interventi
  │    ├─ agenda
  │    ├─ diagnosi
  │    ├─ lavoro
  │    ├─ misure
  │    ├─ checklist
  │    ├─ materiali
  │    ├─ costi
  │    ├─ documenti
  │    └─ storico
  ├─ Preventivi
  ├─ Manutenzioni
  └─ Documenti
```

## Moduli V4
- Dashboard
- Agenda
- Clienti
- Impianti
- Interventi
- Manutenzioni
- Preventivi
- Magazzino
- Economia
- Documenti
- Mappa & percorsi
- Energia
- TECNOFA AI
- Impostazioni

## Regola delle schede
Ogni record importante deve avere:
1. dati principali;
2. dati tecnici o operativi;
3. elementi collegati;
4. storico movimenti;
5. azioni rapide;
6. stato e date;
7. documenti quando applicabile.

## Intervento
L'intervento è il nucleo operativo. Deve poter essere aperto dopo la creazione e modificato nella stessa scheda.

Campi principali:
- data
- cliente
- impianto
- tipo
- titolo/richiesta
- stato
- priorità
- tecnico
- orari
- ore
- km
- viaggio
- rapportino
- richiesta/sintomo
- diagnosi
- lavoro eseguito
- misure/parametri
- checklist
- materiali
- esito
- note
- follow-up
- manodopera
- materiali
- trasferta
- altri costi
- totale
- note amministrative

## Storico
Ogni modifica significativa genera un movimento con:
- ID movimento
- ID entità
- tipo entità
- azione
- dettaglio
- data/ora

Lo storico è visibile:
- Dashboard
- Cliente
- Impianto
- Intervento
- Impostazioni / storico globale

## Stati intervento
`bozza → programmato → assegnato → confermato → in viaggio → in corso → sospeso → da completare → in attesa → da preventivare → completato → da validare → chiuso`

Gli stati `annullato` e `archiviato` sono terminali operativi, senza cancellazione silenziosa della storia.

## Persistenza
La V4 mantiene la compatibilità con i dati localStorage delle versioni precedenti (`tecnofa_v1`, `tecnofa_v2`, `tecnofa_v3`) e salva la nuova struttura in `tecnofa_v4`.

## Evoluzione successiva
1. IndexedDB al posto del solo localStorage.
2. Allegati e foto reali.
3. Firma cliente.
4. Rapportino PDF.
5. Movimenti magazzino automatici da materiali intervento.
6. Timer intervento.
7. Calendario avanzato e drag&drop.
8. Autenticazione e database cloud.
9. Sincronizzazione offline/online.
10. Home Assistant / TECNOFA Energy.
11. Assistente AI operativo.
