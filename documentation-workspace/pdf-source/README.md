# Rigenerazione del PDF

Il PDF è generato dal sorgente `BugBoard26.md` con ReportLab. Creare un ambiente Python temporaneo, installare `requirements.txt` e lanciare:

```powershell
python documentation-workspace/pdf-source/build_pdf.py
```

Il risultato stabile è `docs/BugBoard26.pdf`. Dopo ogni modifica renderizzare tutte le pagine con Poppler (`pdftoppm -png`) e ispezionarle visivamente; `/docs` deve continuare a contenere soltanto il PDF finale.

Il builder normalizza i trattini tipografici, crea indice, segnalibri, intestazioni, piè di pagina e incorpora le esportazioni UML e i mock-up. Le dipendenze Python non devono essere versionate nel repository.
