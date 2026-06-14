#!/usr/bin/env bash
# Lance le forwarding des webhooks Stripe vers l'API locale.
# Prérequis : Stripe CLI installée (brew install stripe/stripe-cli/stripe)
set -euo pipefail

API_PORT="${PORT:-3001}"
TARGET="localhost:${API_PORT}/api/webhooks/stripe"

if ! command -v stripe >/dev/null 2>&1; then
  echo "Stripe CLI introuvable."
  echo "Installation : brew install stripe/stripe-cli/stripe"
  echo "Puis : stripe login"
  exit 1
fi

echo "Forwarding webhooks Stripe → http://${TARGET}"
echo "Copiez le whsec_… affiché dans STRIPE_WEBHOOK_SECRET (apps/api/.env)"
echo ""

exec stripe listen --forward-to "http://${TARGET}"
