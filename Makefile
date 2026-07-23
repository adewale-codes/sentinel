.PHONY: up down down-v migrate train seed-drift monitor test logs ps

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

seed-drift:
	docker compose exec api python ml/seed_predictions.py

monitor:
	curl -X POST http://localhost:8000/api/monitoring/run

test:
	docker compose exec api pytest

logs:
	docker compose logs -f

ps:
	docker compose ps
