import test from 'node:test';
import assert from 'node:assert/strict';

import { generateReportJson } from '../src/scripts/services/report-builder.js';

test('generateReportJson construye secciones y escala puntuaciones', () => {
  const analysisResults = {
    madurezDigital: { adaptabilidad: 3.0, resolucionDeProblemas: 2.8, proactividadDigital: 2.4 },
    brechaDigital: { analisisDeDatos: 3.2, alfabetizacionDeDatos: 3.0, colaboracionDigital: 2.6, ciberseguridad: 3.0 },
    usoInteligenciaArtificial: { interesEnAprendizaje: 3.4, nivelDeAdopcion: 3.1, frecuenciaDeUso: 3.0, habilidadDeUso: 3.2, percepcionDeRiesgo: 2.4, eticaYVerificacion: 3.2 },
    culturaOrganizacional: { liderazgoYVision: 2.8, ambienteDeAprendizaje: 2.7, apoyoOrganizacional: 2.6, experimentacion: 2.9, reconocimiento: 2.7 },
    rolLiderazgo: { usoDeBI: 3.0 },
  };

  const qualitativeResults = {
    resumenEjecutivo: { resumenGeneral: 'OK', fortalezas: [], oportunidades: [] },
    introduccion: 'Intro IA',
    brechaDigital: { textoNivelActual: 'Nivel', textoOportunidadParrafo: 'Oport.' },
    madurezDigital: { parrafoIntroductorio: 'Intro Madurez', componentes: [] },
    competenciasDigitales: { nivelDesarrollo: 'Nivel', descripcionPromedio: 'Desc', competencias: [] },
    usoInteligenciaArtificial: { resumen: 'Resumen', graficos: [] },
    culturaOrganizacional: { insights: { resumen: 'Resumen', puntos: [] }, tarjetas: [] },
    planAccion: { resumenGeneral: 'Resumen', iniciativas: [] },
  };

  const out = generateReportJson(analysisResults, qualitativeResults, 100, 'EmpresaX', 'RPT-001', 'gemini', 'gemini-2.5-pro');

  assert.equal(out.header.empresa, 'EmpresaX');
  assert.equal(out.header.idReporte, 'RPT-001');
  assert.ok(out.resumenEjecutivo);
  assert.ok(out.madurezDigital.componentes.length >= 3);

  // Escala a 10: 3.0 -> 7.5
  const adapt = out.madurezDigital.componentes.find(c => c.nombre.toLowerCase().includes('adaptabilidad'));
  assert.ok(adapt, 'Debe existir componente adaptabilidad');
  assert.equal(adapt.puntuacion, 7.5);

  // roleSpecificScores debe existir y estar escalado
  assert.ok(out.roleSpecificScores.rolLiderazgo);
  assert.equal(out.roleSpecificScores.rolLiderazgo.usoDeBI, 7.5);
});

