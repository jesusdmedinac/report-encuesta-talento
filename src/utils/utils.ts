import scales from "../scripts/baremos.json"

export type NivelMadurez = "Inicial" | "En desarrollo" | "Avanzado";

export const ClassByLevel: Record<NivelMadurez, string> = {
  "Inicial": "lvl-low",
  "En desarrollo": "lvl-mid",
  "Avanzado": "lvl-high",
} as const;

export type ScaleDecile = {
  puntaje: number;
  nivel: string;
  desde: number;
  hasta: number;
}

export const scoreToScaleDecile: (score: number, dimension: string) => ScaleDecile | undefined = (score: number, dimension: string) => {   
  const generalDeciles = scales.deciles.general as {
    [key: string]: ScaleDecile[]
  }
  const decile = generalDeciles[dimension].find((decile) => score >= decile.desde && score <= decile.hasta)
  return decile
}