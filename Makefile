# Makefile pro Zvonkové tablo Tesla / GUARD prima
SHELL := /usr/bin/env bash
PNPM ?= pnpm
WEB_DIR := web

.DEFAULT_GOAL := help

.PHONY: help
help: ## Zobrazit tuto nápovědu
	@echo -e "\033[1;34mZvonkové tablo Tesla / GUARD prima - Příkazy pro vývoj a údržbu\033[0m"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: install
install: ## Nainstalovat závislosti (pnpm install ve web/)
	cd $(WEB_DIR) && $(PNPM) install

.PHONY: dev
dev: ## Spustit lokální vývojový server Vite
	cd $(WEB_DIR) && $(PNPM) run dev

.PHONY: build
build: ## Zkompilovat produkční standalone aplikaci (zvonky-editor.html)
	cd $(WEB_DIR) && $(PNPM) run build

.PHONY: preview
preview: ## Spustit lokální náhled produkčního buildu
	cd $(WEB_DIR) && $(PNPM) run preview

.PHONY: lint
lint: ## Zkontrolovat typy a Svelte šablony pomocí svelte-check
	cd $(WEB_DIR) && $(PNPM) run lint

.PHONY: check
check: lint build ## Provést kompletní kontrolu (lint/svelte-check a produkční build)

.PHONY: outdated
outdated: ## Zkontrolovat zastaralé závislosti pnpm
	@cd $(WEB_DIR) && $(PNPM) outdated || true

.PHONY: update
update: ## Bezpečně aktualizovat závislosti v rámci semveru (^ minor & patch)
	cd $(WEB_DIR) && $(PNPM) update

.PHONY: upgrade
upgrade: ## Interaktivně vybrat a povýšit verze závislostí
	cd $(WEB_DIR) && $(PNPM) update -i -L

.PHONY: upgrade-major
upgrade-major: ## Povýšit všechny závislosti na nejnovější hlavní verze (může obsahovat breaking changes)
	@echo "Upozornění: Major verze (např. Svelte 5->6, Vite 6->7) mohou obsahovat zpětně nekompatibilní změny."
	cd $(WEB_DIR) && $(PNPM) update --latest

.PHONY: audit
audit: ## Spustit bezpečnostní audit balíčků
	@cd $(WEB_DIR) && $(PNPM) audit || true

.PHONY: audit-fix
audit-fix: ## Automaticky opravit bezpečnostní zranitelnosti
	cd $(WEB_DIR) && $(PNPM) audit --fix

.PHONY: clean
clean: ## Vyčistit build artefakty a dočasné cache
	rm -rf $(WEB_DIR)/dist $(WEB_DIR)/.vite $(WEB_DIR)/node_modules/.vite
	@echo "Vyčištěno."
