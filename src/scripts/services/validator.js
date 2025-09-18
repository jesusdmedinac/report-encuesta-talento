// Validación mínima y pragmática sin dependencias externas

function isString(v) { return typeof v === 'string' && v.length >= 0; }
function isNumber(v) { return typeof v === 'number' && !Number.isNaN(v); }
function isArray(v) { return Array.isArray(v); }
function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }

function collectErrors(errors, path, condition, message) {
  if (!condition) errors.push(`${path}: ${message}`);
}

export function validateAiResponse(ai) {
  const errors = [];
  collectErrors(errors, 'root', isObject(ai), 'debe ser un objeto');
  if (!isObject(ai)) throw new Error(errors.join('\n'));

  // resumenEjecutivo
  collectErrors(errors, 'resumenEjecutivo', isObject(ai.resumenEjecutivo), 'falta objeto');
  if (isObject(ai.resumenEjecutivo)) {
    collectErrors(errors, 'resumenEjecutivo.resumenGeneral', isString(ai.resumenEjecutivo.resumenGeneral), 'debe ser string');
    collectErrors(errors, 'resumenEjecutivo.fortalezas', isArray(ai.resumenEjecutivo.fortalezas), 'debe ser array');
    collectErrors(errors, 'resumenEjecutivo.oportunidades', isArray(ai.resumenEjecutivo.oportunidades), 'debe ser array');
  }

  // introduccion
  collectErrors(errors, 'introduccion', isString(ai.introduccion), 'debe ser string');

  // brechaDigital
  collectErrors(errors, 'brechaDigital', isObject(ai.brechaDigital), 'falta objeto');
  if (isObject(ai.brechaDigital)) {
    ['textoNivelActual','textoOportunidadParrafo','parrafo1','parrafo2']
      .forEach(k => collectErrors(errors, `brechaDigital.${k}`, isString(ai.brechaDigital[k]), 'debe ser string'));
  }

  // madurezDigital
  collectErrors(errors, 'madurezDigital', isObject(ai.madurezDigital), 'falta objeto');
  if (isObject(ai.madurezDigital)) {
    collectErrors(errors, 'madurezDigital.parrafoIntroductorio', isString(ai.madurezDigital.parrafoIntroductorio), 'debe ser string');
    collectErrors(errors, 'madurezDigital.componentes', isArray(ai.madurezDigital.componentes), 'debe ser array');
  }

  // competenciasDigitales
  collectErrors(errors, 'competenciasDigitales', isObject(ai.competenciasDigitales), 'falta objeto');
  if (isObject(ai.competenciasDigitales)) {
    collectErrors(errors, 'competenciasDigitales.nivelDesarrollo', isString(ai.competenciasDigitales.nivelDesarrollo), 'debe ser string');
    collectErrors(errors, 'competenciasDigitales.descripcionPromedio', isString(ai.competenciasDigitales.descripcionPromedio), 'debe ser string');
    collectErrors(errors, 'competenciasDigitales.competencias', isArray(ai.competenciasDigitales.competencias), 'debe ser array');
  }

  // usoInteligenciaArtificial
  collectErrors(errors, 'usoInteligenciaArtificial', isObject(ai.usoInteligenciaArtificial), 'falta objeto');
  if (isObject(ai.usoInteligenciaArtificial)) {
    collectErrors(errors, 'usoInteligenciaArtificial.resumen', isString(ai.usoInteligenciaArtificial.resumen), 'debe ser string');
    collectErrors(errors, 'usoInteligenciaArtificial.graficos', isArray(ai.usoInteligenciaArtificial.graficos), 'debe ser array');
  }

  // culturaOrganizacional
  collectErrors(errors, 'culturaOrganizacional', isObject(ai.culturaOrganizacional), 'falta objeto');
  if (isObject(ai.culturaOrganizacional)) {
    const insights = ai.culturaOrganizacional.insights;
    collectErrors(errors, 'culturaOrganizacional.insights', isObject(insights), 'falta objeto');
    if (isObject(insights)) {
      collectErrors(errors, 'culturaOrganizacional.insights.resumen', isString(insights.resumen), 'debe ser string');
      collectErrors(errors, 'culturaOrganizacional.insights.puntos', isArray(insights.puntos), 'debe ser array');
    }
    collectErrors(errors, 'culturaOrganizacional.tarjetas', isArray(ai.culturaOrganizacional.tarjetas), 'debe ser array');
  }

  // planAccion
  collectErrors(errors, 'planAccion', isObject(ai.planAccion), 'falta objeto');
  if (isObject(ai.planAccion)) {
    collectErrors(errors, 'planAccion.resumenGeneral', isString(ai.planAccion.resumenGeneral), 'debe ser string');
    collectErrors(errors, 'planAccion.iniciativas', isArray(ai.planAccion.iniciativas), 'debe ser array');
  }

  if (errors.length) {
    const msg = `Validación de AIResponse falló (campos requeridos o tipos inválidos):\n- ${errors.join('\n- ')}`;
    throw new Error(msg);
  }
  return true;
}

export function validateFinalReport(report) {
  const errors = [];
  collectErrors(errors, 'header', isObject(report.header), 'falta objeto');
  if (isObject(report.header)) {
    ['empresa','fechaDiagnostico','titulo','idReporte','empleadosEvaluados','provider','model']
      .forEach(k => collectErrors(errors, `header.${k}`, isString(report.header[k]), 'debe ser string'));
  }

  // Secciones clave
  collectErrors(errors, 'resumenEjecutivo', isObject(report.resumenEjecutivo), 'falta objeto');
  collectErrors(errors, 'introduccion', isObject(report.introduccion), 'falta objeto');
  collectErrors(errors, 'brechaDigital', isObject(report.brechaDigital), 'falta objeto');
  collectErrors(errors, 'madurezDigital', isObject(report.madurezDigital), 'falta objeto');
  collectErrors(errors, 'competenciasDigitales', isObject(report.competenciasDigitales), 'falta objeto');
  collectErrors(errors, 'usoInteligenciaArtificial', isObject(report.usoInteligenciaArtificial), 'falta objeto');
  collectErrors(errors, 'culturaOrganizacional', isObject(report.culturaOrganizacional), 'falta objeto');
  collectErrors(errors, 'planAccion', isObject(report.planAccion), 'falta objeto');
  collectErrors(errors, 'roleSpecificScores', isObject(report.roleSpecificScores), 'falta objeto');

  if (errors.length) {
    const msg = `Validación de Reporte final falló:\n- ${errors.join('\n- ')}`;
    throw new Error(msg);
  }
  return true;
}

