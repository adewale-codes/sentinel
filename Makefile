.PHONY: up down down-v migrate train test logs ps

up:
	docker compose up -d --build

down:
	docker compose down

down-v:
	docker compose down -v

migrate:
	docker compose exec api alembic upgrade head

train:
	docker compose exec api python ml/train.py

test:
	docker compose exec api pytest

logs:
	docker compose logs -f

ps:
	docker compose ps
