"""Add client_templates and mapped_transactions tables

Revision ID: 002_mapper
Revises: 001_initial
Create Date: 2026-03-02
"""
from alembic import op
import sqlalchemy as sa

revision = '002_mapper'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'client_templates',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('industry', sa.String(50), nullable=False, index=True),
        sa.Column('country', sa.String(5), nullable=False, server_default='RU'),
        sa.Column('mapping', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'mapped_transactions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('industry', sa.String(50), nullable=False, index=True),
        sa.Column('country', sa.String(5), nullable=False, server_default='RU'),
        sa.Column('date', sa.DateTime(), nullable=True),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('raw', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('mapped_transactions')
    op.drop_table('client_templates')
