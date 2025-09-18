#!/usr/bin/env bash
set -Eeuo pipefail

# Commit all current changes with a robust flow (tests + safety checks).
# Usage:
#   ./commit-all.sh [-m "mensaje"] [--force] [--skip-tests] [--no-verify] [--push]

MSG=""
FORCE=0
SKIP_TESTS=0
NO_VERIFY=0
DO_PUSH=0

while (( "$#" )); do
  case "$1" in
    -m|--message)
      MSG="$2"; shift 2 ;;
    --force)
      FORCE=1; shift ;;
    --skip-tests)
      SKIP_TESTS=1; shift ;;
    --no-verify)
      NO_VERIFY=1; shift ;;
    --push)
      DO_PUSH=1; shift ;;
    *)
      echo "Opción desconocida: $1" >&2; exit 1 ;;
  esac
done

# 1) Verificar repo git
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Este script debe ejecutarse dentro de un repositorio git." >&2
  exit 1
fi

# 2) Manejo de index.lock seguro
if [[ -f .git/index.lock ]]; then
  if [[ "$FORCE" == "1" ]]; then
    echo "Encontrado .git/index.lock. --force activo: eliminando lock..."
    rm -f .git/index.lock
  else
    echo "Error: Existe .git/index.lock. Si estás seguro de que no hay otra operación git en curso, reintenta con --force." >&2
    exit 1
  fi
fi

# 3) Asegurar permisos de ejecución de scripts CLI (si existen)
chmod +x ./generate.sh 2>/dev/null || true

# 4) Ejecutar tests (si no se omiten)
if [[ "$SKIP_TESTS" != "1" ]]; then
  echo "Ejecutando tests..."
  if ! npm test --silent; then
    echo "Los tests fallaron. Corrige los errores o ejecuta con --skip-tests si estás seguro." >&2
    exit 1
  fi
fi

# 5) Proteger .env (no commitear por accidente)
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "Quitando .env del índice para evitar exponer secretos..."
  git restore --staged .env || true
fi

# 6) Preparar mensaje de commit si no se proporcionó
if [[ -z "$MSG" ]]; then
  CHANGES=$(git status --porcelain)
  FILES_CHANGED=$(echo "$CHANGES" | wc -l | tr -d ' ')
  MSG="chore(repo): aplicar cambios locales (${FILES_CHANGED} archivos)\n\nResumen de cambios:\n$CHANGES"
fi

# 7) Hacer commit
echo "Agregando cambios y creando commit..."
git add -A
if [[ "$NO_VERIFY" == "1" ]]; then
  git commit --no-verify -m "$MSG"
else
  git commit -m "$MSG"
fi

SHA=$(git rev-parse --short HEAD)
echo "Commit creado: $SHA"

# 8) Push (opcional)
if [[ "$DO_PUSH" == "1" ]]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "Haciendo push a la rama $BRANCH..."
  git push origin "$BRANCH"
fi

echo "Listo."

