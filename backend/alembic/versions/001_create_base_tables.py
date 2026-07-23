"""create base tables

Revision ID: 001
Revises:
Create Date: 2026-07-23

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS model_versions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            version VARCHAR(50) UNIQUE NOT NULL,
            algorithm VARCHAR(100) NOT NULL,
            trained_at TIMESTAMPTZ DEFAULT now(),
            training_samples INTEGER,
            features JSONB,
            metrics JSONB,
            is_active BOOLEAN DEFAULT false,
            model_path VARCHAR(500),
            notes TEXT
        )
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS predictions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            model_version_id UUID REFERENCES model_versions(id),
            transaction_id VARCHAR(100),
            amount NUMERIC(12,2),
            merchant_category VARCHAR(100),
            time_of_day INTEGER,
            location_mismatch BOOLEAN,
            transaction_velocity INTEGER,
            account_age_days INTEGER,
            prediction VARCHAR(20) NOT NULL,
            confidence NUMERIC(5,4),
            is_fraud BOOLEAN NOT NULL,
            ground_truth BOOLEAN,
            predicted_at TIMESTAMPTZ DEFAULT now(),
            raw_features JSONB
        )
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS drift_alerts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            model_version_id UUID REFERENCES model_versions(id),
            detected_at TIMESTAMPTZ DEFAULT now(),
            drift_score NUMERIC(8,6),
            baseline_fraud_rate NUMERIC(5,4),
            current_fraud_rate NUMERIC(5,4),
            window_size INTEGER,
            status VARCHAR(50) DEFAULT 'active',
            resolved_at TIMESTAMPTZ,
            notes TEXT
        )
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS monitoring_runs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            started_at TIMESTAMPTZ DEFAULT now(),
            completed_at TIMESTAMPTZ,
            status VARCHAR(50) DEFAULT 'running',
            predictions_analysed INTEGER DEFAULT 0,
            drift_detected BOOLEAN DEFAULT false,
            drift_score NUMERIC(8,6),
            error_message TEXT
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS monitoring_runs")
    op.execute("DROP TABLE IF EXISTS drift_alerts")
    op.execute("DROP TABLE IF EXISTS predictions")
    op.execute("DROP TABLE IF EXISTS model_versions")
