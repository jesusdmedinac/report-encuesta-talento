#!/bin/bash
npm run generate-report -- \
  --csv=./data/respuestas-por-puntos.csv \
  --empresa="Banco de Guayaquil" \
  --reportId="TBjwOGHs" \
  --provider=openai \
  --model="gpt-5"
