#!/usr/bin/env bash
set -Eeuo pipefail

# Load .env if present
if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

# Helpers
has_arg() {
  local key="$1"; shift || true
  for a in "$@"; do [[ "$a" == ${key}* ]] && return 0; done
  return 1
}
get_arg_val() {
  local key="$1"; shift || true
  for a in "$@"; do
    if [[ "$a" == ${key}=* ]]; then echo "${a#${key}=}"; return 0; fi
  done
  return 1
}

# Provider (arg > env > default)
PROVIDER_ARG=$(get_arg_val --provider "$@" || true)
PROVIDER=${PROVIDER_ARG:-${PROVIDER:-gemini}}

# Defaults (overridable via env)
CSV_PATH_DEFAULT="${CSV_PATH:-./data/respuestas-por-puntos.csv}"
EMPRESA_DEFAULT="${EMPRESA:-Banco Guayaquil}"
REPORT_ID_DEFAULT="${REPORT_ID:-TBjwOGHs}"

# Choose model default per provider (overridable via env MODEL or --model)
case "$PROVIDER" in
  gemini) MODEL_DEFAULT="${MODEL:-gemini-2.5-flash}" ;;
  openai) MODEL_DEFAULT="${MODEL:-gpt-5}" ;;
  *) echo "Proveedor no soportado: $PROVIDER (usa gemini|openai)" >&2; exit 1;;
esac

# Resolve effective params (prefer CLI if provided)
CSV_EFF=$(get_arg_val --csv "$@" || true); CSV_EFF=${CSV_EFF:-$CSV_PATH_DEFAULT}
EMPRESA_EFF=$(get_arg_val --empresa "$@" || true); EMPRESA_EFF=${EMPRESA_EFF:-$EMPRESA_DEFAULT}
REPORT_ID_EFF=$(get_arg_val --reportId "$@" || true); REPORT_ID_EFF=${REPORT_ID_EFF:-$REPORT_ID_DEFAULT}
MODEL_ARG=$(get_arg_val --model "$@" || true); MODEL_EFF=${MODEL_ARG:-$MODEL_DEFAULT}

# Validations
[[ -f "$CSV_EFF" ]] || { echo "CSV no encontrado: $CSV_EFF" >&2; exit 1; }
if [[ "$PROVIDER" == "gemini" ]]; then
  [[ -n "${GEMINI_API_KEY:-}" ]] || { echo "Falta GEMINI_API_KEY en entorno/.env" >&2; exit 1; }
else
  [[ -n "${OPENAI_API_KEY:-}" ]] || { echo "Falta OPENAI_API_KEY en entorno/.env" >&2; exit 1; }
fi


# Build CLI ensuring required args are present; pass through extras
EXTRA_ARGS=()
has_arg --provider "$@" || EXTRA_ARGS+=("--provider=$PROVIDER")
has_arg --model "$@"    || EXTRA_ARGS+=("--model=$MODEL_EFF")
has_arg --csv "$@"      || EXTRA_ARGS+=("--csv=$CSV_EFF")
has_arg --empresa "$@"  || EXTRA_ARGS+=("--empresa=$EMPRESA_EFF")
has_arg --reportId "$@" || EXTRA_ARGS+=("--reportId=$REPORT_ID_EFF")

npm run generate-report -- \
  ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"} \
  "$@"
