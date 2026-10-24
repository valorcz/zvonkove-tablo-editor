# Zvonkové tablo Tesla / GUARD prima (28 bytů)

Interaktivní webový editor a generátor tiskových podkladů pro jmenovky zvonkového tabla bytového domu.

Aplikace je navržena pro zvonkové tablo **Tesla / GUARD prima** s 28 byty (3 sloupce: 10 + 10 + 8 zvonků) a umožňuje snadnou editaci jmenovek, import/export CSV, vizuální kontrolu v reálném čase a tisk na formát **A4 na šířku v přesném fyzickém měřítku 1:1**.

---

## 🚀 Rychlý start (pro běžné použití)

Pro běžné použití **není potřeba nic instalovat ani spouštět žádný server**. 

Stačí otevřít soubor [`zvonky-editor.html`](zvonky-editor.html) v libovolném moderním webovém prohlížeči (Chrome, Firefox, Safari, Edge). Soubor je 100% samostatný (self-contained), funguje zcela offline bez připojení k internetu a obsahuje veškerá potřebná písma i grafické podklady přímo v sobě.

---

## ✨ Klíčové funkce

- **100% samostatná offline aplikace ([`zvonky-editor.html`](zvonky-editor.html))**: Žádné externí závislosti, žádné CDN – všechna písma a skripty jsou vloženy přímo do jednoho HTML souboru.
- **Čistá vektorová grafika**: Původní rastrový podklad byl kompletně nahrazen přesnými vektorovými prvky (`<rect>`). Ořezové linky i rámečky jsou dokonale ostré na jakékoliv tiskárně.
- **Písma přímo v balíčku s plnou českou diakritikou**:
  - **Technic NT** (z písmolijny FI MUNI) – technické normalizované písmo vycházející z ČSN, výchozí volba pro čistý industriální vzhled tabla.
  - **DIN 1451 / Bahnschrift** (`DINish`) – klasický standard pro informační systémy a značení.
  - **Fira Sans Condensed** – moderní úzký humanistický sans-serif.
  - **Iosevka** – úzký monospace font se strojovým vzhledem.
  - **Futura** – geometrický bezpatkový font.
- **Přepínač řezu písma (`B`)**: Okamžité přepnutí mezi základním (Regular) a tučným (Bold) řezem.
- **Podpora dvouřádkových jmenovek**: Pokud štítek obsahuje více jmen, stačí je oddělit lomítkem nebo středníkem (např. `Jan Novák / Marie Nováková`). Text se automaticky zalomí a vystředí do dvou řádků.
- **Chytré přizpůsobení délky textu**: Aplikace dynamicky měří šířku jména. Při delším textu automaticky zmenšuje velikost písma a v editačním formuláři zobrazuje varovné štítky:
  - `⚠️ Zmenšeno` (oranžová): text musel být zmenšen, aby se vešel.
  - `⚠️ Nevejde se` (červená): text je příliš dlouhý i při minimální čitelné velikosti písma.
- **4 typografické šablony čísel bytů**:
  - **Klasický štítek (vpravo)**: Zaoblený barevný obdélníček na pravé straně (původní styl z předlohy).
  - **Technický prefix (vlevo)**: Čísla tvoří svislý sloupec na levém okraji s dělící linkou (standard ČSN a DIN 1451, ideální pro rychlé vyhledání bytu shora dolů).
  - **Decentní index (v rohu)**: Malé elegantní číslo v pravém horním rohu, které uvolňuje hlavní osu pro dlouhá jména.
  - **Jemný vodoznak (v pozadí)**: Velké číslo v pozadí (15 % krytí akcentní barvy), jméno prochází v popředí v plné černé barvě.
  - **Bez čísel**: Čisté jmenovky bez čísel s maximálním prostorem pro text.
- **Vnější ořezové značky (Crop marks)**: Volitelné jemné značky v rozích sloupců mimo tiskovou oblast pro přesné a rychlé řezání pravítkem nebo pákovou řezačkou.
- **Hromadné vložení seznamu (Vložit text)**: Dialog pro zkopírování 28 řádků ze schránky (z Wordu, e-mailu) a okamžité naplnění celého tabla.
- **Klávesová navigace**: Klávesa `Enter` v editačním políčku automaticky posouvá kurzor na další řádek / byt.
- **Plovoucí Zoom & Focus widget**:
  - Krokování lupy (`−` a `+`) v rozsahu 50 % až 400 %.
  - Kliknutí na procenta (`{zoom}%`) **okamžitě obnoví celkový pohled na celou A4**.
  - Tlačítka **`Sloupec 1`**, **`Sloupec 2`**, **`Sloupec 3`** pro okamžité přiblížení na 260 % a automatické vystředění konkrétního sloupce pro detailní kontrolu jmen.
- **Čísla bytů (Flat IDs) pro montáž**: Volitelné podkresové štítky s čísly bytů (`01`–`28`) usnadňující osazování do fyzického tabla. Barva podkladu čísel je nastavitelná přes paletu nebo předvolby (výchozí broskvová `#FFE6C7`, modrá, žlutá, šedá, bílá). Ve výchozím stavu jsou skryté.
- **Tiskové kalibrační pravítko 100 mm**: Umístěno ve spodním okraji stránky pro fyzické ověření pravítkem, že tiskárna nezmenšila ani nezvětšila měřítko.
- **Práce s daty a automatické ukládání**:
  - Drag & Drop CSV souboru přímo do okna prohlížeče.
  - Tlačítka **Nahrát CSV** a **Stáhnout CSV**.
  - Tlačítko **Stáhnout SVG** (vygeneruje samostatné tiskové SVG se všemi vloženými fonty a pevnými rozměry 297 × 210 mm).
  - Průběžné automatické ukládání změn do `localStorage` prohlížeče.

---

## 📐 Rozložení a rozměry tabla

Tablo odpovídá fyzickému uspořádání Tesla / GUARD prima pro 28 bytů (3 svislé sloupce, modul reproduktoru je umístěn vlevo vedle tlačítek):

| Sloupec | Řádky | Byty | Počet štítků |
| :--- | :--- | :--- | :--- |
| **Sloupec 1** (vlevo) | Řádek 0 až 9 | Byty **10** (nahoře) až **01** (dole) | 10 štítků |
| **Sloupec 2** (uprostřed) | Řádek 0 až 9 | Byty **20** (nahoře) až **11** (dole) | 10 štítků |
| **Sloupec 3** (vpravo) | Řádek 2 až 9 | Byty **28** (nahoře) až **21** (dole) | 8 štítků |

- **Rozměr jednoho štítku**: $48{,}6 \times 12{,}9\text{ mm}$ ($490 \times 130\text{ px}$ při 300 DPI).
- **Rozměr jednoho sloupce**: $621 \times 1611\text{ px}$.
- **Výsledný tiskový formát**: A4 na šířku ($297 \times 210\text{ mm}$, $3508 \times 2481\text{ px}$ při 300 DPI).

---

## 🖨️ Pokyny pro bezchybný tisk v měřítku 1:1

Při tisku přímo z prohlížeče (tlačítko **Tisk / PDF** nebo klávesová zkratka `Ctrl+P` / `Cmd+P`) je zásadní správné nastavení v tiskovém okně prohlížeče:

1. **Okraje (Margins)**: Nastavte na **Žádné (None / 0 mm)**!
   > ⚠️ **Pozor na výchozí nastavení prohlížeče:** Pokud v tiskovém dialogu ponecháte volbu *„Výchozí“ (Default)*, prohlížeč automaticky přidá cca 10mm okraje a zmenší celou stránku na cca 90 %. Vytištěné 100mm měřítko by pak mělo jen necelých 9 cm! Nastavením *Žádné* se tiskne v přesném poměru 1:1.
2. **Měřítko (Scale)**: Nastavte na **100 %** nebo **Skutečná velikost** (*Actual size*). Nikdy nepoužívejte volbu *„Přizpůsobit stránce“* (*Fit to printable area*).
3. **Orientace**: Na šířku (*Landscape*).
4. **Formát papíru**: A4.
5. **Grafika na pozadí**: Zaškrtněte **Povolit grafiku na pozadí** (*Background graphics*), aby se vytiskly ořezové rámečky.
6. **Fyzická kontrola**: Po vytištění změřte pravítkem 100mm kalibrační měřítko ve spodní části stránky. Musí měřit přesně 10 cm.

💡 *Alternativa:* Můžete také použít tlačítko **Stáhnout SVG**. Vygenerovaný SVG soubor má fyzické rozměry $297 \times 210\text{ mm}$ pevně zadané přímo v hlavičce a vytiskne se v přesném měřítku 1:1 v libovolném vektorovém programu (Inkscape, Affinity Designer, Illustrator) i v prohlížeči.

---

## 🛠️ Vývoj a údržba projektu

Zdrojový kód webové aplikace je postaven na moderním stacku **Svelte 5**, **Vite 6** a **TypeScript** v adresáři [`web/`](web).

Pro správu projektu je v kořenovém adresáři připraven [`Makefile`](Makefile) s kompletní sadou příkazů:

```bash
make help             # Zobrazí barevný přehled všech dostupných cílů

# Vývoj a sestavení
make install          # Nainstaluje závislosti projektu pomocí pnpm
make dev              # Spustí lokální vývojový server Vite (HMR)
make build            # Zkompiluje produkční samostatný soubor zvonky-editor.html
make preview          # Spustí lokální náhled produkčního sestavení

# Kontrola a linting
make lint             # Spustí svelte-check a TypeScript kontrolu
make check            # Kompletní kontrola (lint + produkční build)

# Správa a údržba balíčků (pnpm)
make outdated         # Zobrazí seznam zastaralých závislostí
make update           # Bezpečně aktualizuje závislosti v rámci semveru (^ minor & patch)
make upgrade          # Interaktivně vybere a povýší verze závislostí (pnpm update -i -L)
make upgrade-major    # Povýší všechny závislosti na nejnovější hlavní verze (pnpm update --latest)
make audit            # Spustí bezpečnostní audit balíčků
make audit-fix        # Automaticky opraví nalezené bezpečnostní zranitelnosti

# Úklid
make clean            # Odstraní build artefakty a dočasné cache
```

---

## 📁 Struktura repozitáře

```
├── Makefile                                    # Sada příkazů pro vývoj, kontrolu a údržbu
├── README.md                                   # Dokumentace projektu v češtině
├── .gitignore                                  # Pravidla pro Git (ignoruje node_modules, dist, cache, deprecated/)
├── zvonky-editor.html                          # Samostatná offline HTML aplikace (distribuce)
├── sample_jmenovky.csv                         # Vzorový CSV soubor s fiktivními jmény pro byty 01–28
└── web/                                        # Zdrojový kód webové aplikace
    ├── package.json                            # Konfigurace balíčků a skriptů
    ├── pnpm-lock.yaml                          # Uzamčené verze závislostí
    ├── tsconfig.json                           # Konfigurace TypeScriptu
    ├── svelte.config.js                        # Konfigurace Svelte preprocessoru
    ├── vite.config.ts                          # Vite konfigurace s vite-plugin-singlefile
    └── src/
        ├── App.svelte                          # Hlavní aplikace a stavový management
        ├── main.ts                             # Vstupní bod aplikace
        ├── fonts.css                           # Lokální @font-face deklarace
        ├── assets/
        │   ├── embeddedAssets.ts               # Base64 data URI fontů pro SVG export
        │   └── fonts/                          # Optimalizované WOFF fonty (Technic NT, DIN, Fira, Iosevka)
        ├── components/
        │   ├── Header.svelte                   # Horní lišta (fonty, řezy, barvy, import/export, tiskové okno)
        │   ├── FlatList.svelte                 # Editační panel pro 28 bytů s detekcí přetečení
        │   └── TableauSvg.svelte               # SVG náhled tabla s plovoucí zoomovací lištou
        └── lib/
            ├── csvParser.ts                    # Import a export CSV formátu (výchozí vzorová jména)
            ├── svgGenerator.ts                 # Generátor samostatného tiskového SVG (297 × 210 mm)
            ├── tableauConfig.ts                # Geometrie, souřadnice sloupců a šablony
            └── types.ts                        # TypeScript definice
```
