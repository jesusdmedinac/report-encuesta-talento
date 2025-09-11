#!/bin/bash
npm run generate-report -- \
  --csv=./data/respuestas-por-puntos.csv \
  --empresa="Banco de Guayaquil" \
  --reportId="TBjwOGHs" \
  --provider=gemini \
  --model="gemini-2.5-pro"
