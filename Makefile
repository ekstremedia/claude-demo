ifneq (,$(wildcard ./.env))
include .env
export
endif

APP_SERVICE ?= app
DB_SERVICE ?= postgres

APP_URL ?= http://localhost:8120
MAILPIT_HOST_PORT ?= 8125

.PHONY: help build up down restart destroy shell tinker logs logs-all \
        migrate fresh seed test test-js typecheck pint stan \
        composer-install npm-install build-assets mcp _require-local

help: ## Show this help
	@echo "Claude Demo — available commands:"
	@echo ""
	@grep -hE '^[a-zA-Z_-]+:.*## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":[^#]*## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

build: ## Build images and start everything (creates .env if missing)
	@[ -f .env ] || { cp .env.example .env; echo "  → created .env from .env.example"; }
	docker compose up -d --build
	@$(MAKE) --no-print-directory _urls

up: ## Start all containers (creates .env if missing)
	@[ -f .env ] || { cp .env.example .env; echo "  → created .env from .env.example"; }
	docker compose up -d
	@$(MAKE) --no-print-directory _urls

down: ## Stop all containers
	docker compose down

restart: ## Restart all containers
	docker compose restart

# Guard: destructive targets only run when APP_ENV is local.
_require-local:
	@if [ "$(APP_ENV)" != "local" ]; then \
		echo "  ✗ Refusing: APP_ENV is '$(APP_ENV)', not 'local'."; \
		exit 1; \
	fi

destroy: _require-local ## Stop containers and delete volumes (local only)
	docker compose down -v

shell: ## Open a bash shell in the app container
	docker compose exec $(APP_SERVICE) bash

tinker: ## Open Laravel Tinker
	docker compose exec $(APP_SERVICE) php artisan tinker

logs: ## Tail the app container logs
	docker compose logs -f $(APP_SERVICE)

logs-all: ## Tail all container logs
	docker compose logs -f

migrate: ## Run database migrations
	docker compose exec $(APP_SERVICE) php artisan migrate

fresh: _require-local ## Drop, re-migrate and re-seed the database (local only)
	docker compose exec $(APP_SERVICE) php artisan migrate:fresh --seed

seed: ## Run database seeders
	docker compose exec $(APP_SERVICE) php artisan db:seed

test: ## Run the PHP test suite (Pest)
	docker compose exec $(APP_SERVICE) php artisan test

test-js: ## Run the frontend test suite (Vitest)
	docker compose exec $(APP_SERVICE) npm run test

typecheck: ## Type-check the frontend (vue-tsc)
	docker compose exec $(APP_SERVICE) npm run typecheck

pint: ## Check PHP code style (Pint)
	docker compose exec $(APP_SERVICE) vendor/bin/pint --test

stan: ## Run static analysis (Larastan)
	docker compose exec $(APP_SERVICE) vendor/bin/phpstan analyse --memory-limit=1G

composer-install: ## composer install inside the container
	docker compose exec $(APP_SERVICE) composer install

npm-install: ## npm install inside the container
	docker compose exec $(APP_SERVICE) npm install

build-assets: ## Build frontend assets for production
	docker compose exec $(APP_SERVICE) npm run build

mcp: ## Run the Laravel Boost MCP server (used by your AI agent via .mcp.json)
	docker compose exec -T $(APP_SERVICE) php artisan boost:mcp

_urls:
	@echo ""
	@echo "  App:     $(APP_URL)"
	@echo "  Mailpit: http://localhost:$(MAILPIT_HOST_PORT)"
	@echo ""
