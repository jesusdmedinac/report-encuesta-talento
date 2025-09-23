import test from 'node:test';
import assert from 'node:assert/strict';
import { selectIndividualActionPlan } from '../src/scripts/services/action-plan.js';

const catalog = {
  usoInteligenciaArtificial: [
    { id: 'IA-01', type: 'OKR', rolesPreferidos: ['tecnico'], tags: ['ia'], subdimensiones: ['nivelDeAdopcion','habilidadDeUso'], impacto: 'alto', esfuerzo: 'medio', titulo: 'OKR IA', descripcion: '...' },
    { id: 'IA-02', type: 'KPI', rolesPreferidos: ['rrhh'], tags: ['capacitacion'], subdimensiones: ['eticaYVerificacion'], impacto: 'medio', esfuerzo: 'bajo', titulo: 'KPI IA', descripcion: '...' }
  ],
  madurezDigital: [
    { id: 'MD-01', type: 'OKR', rolesPreferidos: ['liderazgo'], tags: ['roadmap'], subdimensiones: ['resolucionDeProblemas'], impacto: 'alto', esfuerzo: 'alto', titulo: 'OKR MD', descripcion: '...' },
    { id: 'MD-02', type: 'KPI', rolesPreferidos: ['operaciones'], tags: ['datos'], subdimensiones: ['alfabetizacionDeDatos'], impacto: 'medio', esfuerzo: 'bajo', titulo: 'KPI MD', descripcion: '...' }
  ]
};

test('elige OKR de la peor dimensión y KPIs tácticos', () => {
  const doc = {
    header: { subject: { demographics: { rol: 'Ingeniero de Sistemas', area: 'Operaciones' } } },
    summary: { dimensions: {
      usoInteligenciaArtificial: { current10: 6.0, target10: 8.0, gap10: 2.0 },
      madurezDigital: { current10: 7.5, target10: 8.0, gap10: 0.5 },
    }},
    openEnded: { D4_OPEN: ['Me interesa capacitarme en IA'] },
    scores10: {
      usoInteligenciaArtificial: { nivelDeAdopcion: 5.0, habilidadDeUso: 6.0, eticaYVerificacion: 7.0 },
      madurezDigital: { resolucionDeProblemas: 7.0, alfabetizacionDeDatos: 6.5 }
    }
  };
  const plan = selectIndividualActionPlan(doc, catalog, { maxIniciativas: 3 });
  assert.ok(plan.iniciativas.find(x => x.id === 'IA-01'), 'incluye OKR IA-01');
  assert.ok(plan.iniciativas.some(x => x.type === 'KPI'), 'incluye al menos un KPI');
});

test('enriquece KPI con metric/target cuando hay subdimensiones', () => {
  const doc = {
    header: { subject: { demographics: { rol: 'Analista', area: 'Comercial' } } },
    summary: { dimensions: {
      usoInteligenciaArtificial: { current10: 6.5, target10: 8.0, gap10: 1.5 }
    }},
    scores10: { usoInteligenciaArtificial: { eticaYVerificacion: 6.0 } }
  };
  const plan = selectIndividualActionPlan(doc, catalog, { maxIniciativas: 2 });
  const kpi = plan.iniciativas.find(x => x.id === 'IA-02');
  assert.ok(kpi, 'existe KPI IA-02');
  assert.ok(kpi.metric && kpi.target, 'KPI enriquecido con metric/target');
});

test('sin brechas sobre el umbral sugiere mantenimiento', () => {
  const doc = {
    header: { subject: { demographics: { rol: 'Ejecutivo', area: 'Operaciones' } } },
    summary: { dimensions: {
      usoInteligenciaArtificial: { current10: 8.0, target10: 8.0, gap10: 0.0 },
      madurezDigital: { current10: 8.1, target10: 8.0, gap10: -0.1 },
    }},
    scores10: { usoInteligenciaArtificial: { nivelDeAdopcion: 8.0 } }
  };
  const plan = selectIndividualActionPlan(doc, catalog, { maxIniciativas: 2 });
  assert.ok(plan && Array.isArray(plan.iniciativas), 'devuelve plan');
});
