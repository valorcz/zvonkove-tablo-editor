# Editor zvonkových tabel (Universal Doorbell Tableau Editor)

Moderní interaktivní webový editor a generátor tiskových podkladů pro jmenovky zvonkových tabel bytových domů v přesném fyzickém měřítku 1:1.

---

## 🚀 Rychlý start

Aplikaci můžete používat dvěma způsoby – **v obou případech bez nutnosti cokoliv instalovat**:

1. **🌐 [Spustit online verzi (GitHub Pages)](https://valorcz.github.io/zvonkove-tablo-editor/)**  
   Funguje ihned v jakémkoliv moderním prohlížeči (Chrome, Firefox, Safari, Edge) na počítači i mobilu.
2. **💾 [Offline verze (soubor `zvonky-editor.html`)](zvonky-editor.html)**  
   Samostatný jednolitý soubor (single-file), který stačí stáhnout a otevřít dvojklikem. Funguje 100% offline bez připojení k internetu a obsahuje veškerá písma i skripty přímo v sobě.

---

## ✨ Klíčové funkce

- **🎯 Univerzální systém pro více výrobců**: Fyzické rozměry, geometrie a presety modulů jsou přehledně definovány v [`web/src/config/hardwareProfiles.yaml`](web/src/config/hardwareProfiles.yaml).
- **🖨️ Bezchybný tisk 1:1 na list A4 na šířku**: Integrované pravidlo `@page { size: A4 landscape; margin: 0; }` garantuje tisk na jediný list bez oříznutí okrajů a bez nechtěné druhé stránky.
- **✂️ Ořezové značky po celých modulech**: Značky umožňují snadné vyříznutí celého svislého sloupce pro zasunutí pod společný akrylátový kryt. Volitelně lze přepnout na režim čistých pásů k vyřezání bez podkladu tabla.
- **📐 Architektonické kóty & technické razítko**: Možnost zapnout kótovací linky se šipkami pro kontrolu rozměrů šuplerou a technické razítko se specifikací výřezu a 100mm kalibračním pravítkem.
- **✍️ Adaptivní typografie podle hardwaru**: Velikost písma a šířka textu se automaticky adaptují podle reálných rozměrů výřezu zvoleného výrobce (např. u Siedle je text o 51 % větší). Podpora dvouřádkových jmenovek (`Jméno 1 / Jméno 2`) i chytré varování při přetečení (`Nevejde se` / `Zmenšeno`).
- **🔢 Styly čísel bytů & volba fontu**: Klasický štítek, kroužek, číslo vpravo, levý blok, jemný vodoznak na pozadí či horní index. Možnost volby strojového monospace písma (Iosevka) nebo fontu shodného se jmény.
- **🔡 Česká typografie přímo v balíčku**: Vložená písma s plnou diakritikou – **Technic NT** (ČSN normalizované technické písmo), **DINish** (DIN 1451), **Fira Sans Condensed** a **Iosevka**.
- **💾 Import, export a zálohy**: Rychlý import/export jmen z CSV souboru, export do tiskového vektorového SVG (297 × 210 mm) a kompletní záloha celého projektu do komentovaného YAML souboru.
- **📱 Pohodlná práce na mobilu i desktopu**: Responzivní rozhraní s plynulým posuvem jmenovek, záložkami a možností detailního přiblížení jednotlivých sloupců.

---

## 🏢 Podporované hardwarové systémy

Aplikace obsahuje předkonfigurované profily pro rozšířená zvonková tabla:

| Výrobce a řada | Výchozí kapacita | Rozměr štítku | Rozteč slotů | Pozice tlačítek |
| :--- | :--- | :--- | :--- | :--- |
| **Tesla Stropkov / GUARD prima** | 28 bytů (10+10+8), 10, 20, 30, 40 | $48{,}6 \times 12{,}9\text{ mm}$ | $15{,}9\text{ mm}$ | vlevo |
| **Urmet Sinthesi** | 16 bytů (8+8) | $55{,}0 \times 14{,}5\text{ mm}$ | $17{,}5\text{ mm}$ | vpravo |
| **Urmet Domus S2** | 16 bytů (moduly po 4) | $55{,}0 \times 14{,}5\text{ mm}$ | $17{,}5\text{ mm}$ | vpravo |
| **Siedle Vario 611** | 12 bytů (4+4+4) | $63{,}0 \times 19{,}5\text{ mm}$ | $23{,}5\text{ mm}$ | vlevo |
| **Bticino Sfera** | 24 bytů (8+8+8) | $58{,}0 \times 15{,}0\text{ mm}$ | $18{,}0\text{ mm}$ | vpravo |
| **Čisté pásy štítků** | 24 bytů (univerzální) | $52{,}0 \times 13{,}5\text{ mm}$ | $16{,}0\text{ mm}$ | bez tlačítek (pouze ořez) |
| **Vlastní rozložení (Custom)** | 1–6 sloupců, volitelná výška | dle zvoleného systému | dle systému | volitelná |

---

## 🖨️ Zásady pro tisk v měřítku 1:1

Při tisku přímo z prohlížeče (tlačítko **Tisk / PDF** nebo `Ctrl+P` / `Cmd+P`) zkontrolujte tato 3 nastavení v dialogu:

1. **Okraje (Margins):** Nastavte na **Žádné (None / 0 mm)**. *(Při volbě „Výchozí“ prohlížeč zmenší stránku na cca 90 %!)*
2. **Měřítko (Scale):** Nastavte na **100 %** nebo **Skutečná velikost (Actual size)**. Nikdy nepoužívejte *Přizpůsobit stránce*.
3. **Grafika na pozadí (Background graphics):** Zaškrtněte **Povolit**, aby se vytiskly barvy štítků a ořezové linky.

> 🔍 **Kontrola pravítkem:** Ve spodní části vytištěné stránky je 100mm kontrolní měřítko. Přiložte běžné pravítko – vzdálenost od 0 do 10 musí měřit přesně 10,0 cm.

---

## 🔧 Fyzická montáž a servis tabla

Podrobný ilustrovaný návod pro správce domů a techniky popisující demontáž rámu klíčem FAB, vyjmutí modulů, uvolnění západek krycích plexiskel a bezpečnou manipulaci se sběrnicovým kabelem naleznete zde:  
👉 **[`docs/montaz_a_vymena_stitku.md`](docs/montaz_a_vymena_stitku.md)**

---

## 🛠️ Vývoj a sestavení

Aplikace je napsána v **Svelte 5**, **TypeScriptu** a sestavována pomocí **Vite 6** s pluginem `vite-plugin-singlefile`.

```bash
make help             # Barevný přehled všech dostupných cílů Makefile
make dev              # Spuštění lokálního vývojového serveru Vite (HMR)
make lint             # Spuštění typové kontroly (svelte-check)
make build            # Sestavení produkčního souboru zvonky-editor.html
make check            # Kompletní ověření: typová kontrola + produkční build
```

### Struktura projektu
- [`zvonky-editor.html`](zvonky-editor.html) – výsledná produkční aplikace pro koncové uživatele (single-file, bez závislostí).
- [`web/src/config/hardwareProfiles.yaml`](web/src/config/hardwareProfiles.yaml) – definice rozměrů a geometrie všech výrobců.
- [`web/src/lib/badgeRegistry.ts`](web/src/lib/badgeRegistry.ts) – definice typografických šablon štítků a čísel bytů.
- [`web/src/lib/svgGenerator.ts`](web/src/lib/svgGenerator.ts) – tiskový vektorový SVG generátor se 100% shodou s živým náhledem.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) – CI/CD automatické nasazení na GitHub Pages při pushi do větve `main`.
