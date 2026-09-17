# RachelRecipes PWA Makefile
SHELL := /bin/bash
PATH_ENV := PATH="/opt/homebrew/bin:/usr/local/bin:$(PATH)"
NPM := $(PATH_ENV) npm

PORT ?= 5173
HOST ?= 127.0.0.1

.DEFAULT_GOAL := help

.PHONY: help install dev start run build test lint preview clean

help: ## Show this help message
	@echo ""
	@echo "RachelRecipes PWA - Local Development Commands"
	@echo "============================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

node_modules: package.json package-lock.json ## Ensure dependencies are installed
	$(NPM) install
	@touch node_modules

install: node_modules ## Install project dependencies

dev: node_modules ## Run the local development server (alias: make run / make start)
	$(NPM) run dev -- --host $(HOST) --port $(PORT)

start: dev ## Alias for make dev

run: dev ## Alias for make dev

build: node_modules ## Build production bundle (TypeScript check & Vite build)
	$(NPM) run build

test: node_modules ## Run unit tests for Hebrew ingredient scaler
	$(NPM) test

lint: node_modules ## Run linter
	$(NPM) run lint

preview: build ## Preview production build locally
	$(NPM) run preview -- --host $(HOST) --port $(PORT)

clean: ## Clean build artifacts and temporary files
	rm -rf dist .playwright-mcp node_modules/.tmp
