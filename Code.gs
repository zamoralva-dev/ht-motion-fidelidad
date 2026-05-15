// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
const SHEET_ID   = 'REEMPLAZA_CON_EL_ID_DE_TU_GOOGLE_SHEET';
const SHEET_NAME = 'Clientes';
// ─────────────────────────────────────────────────────────────────────────────

function doGet(e) {
  const id = ((e && e.parameter && e.parameter.id) || '').trim().toUpperCase();

  if (!id) {
    return jsonError('Se requiere el parámetro id');
  }

  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) return jsonError('Hoja "' + SHEET_NAME + '" no encontrada');

    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      const rowId = String(rows[i][0]).trim().toUpperCase();
      if (rowId !== id) continue;

      const fechaInicio = rows[i][4]; // Columna E
      const meses       = calcMeses(fechaInicio);
      const nivel       = calcNivel(meses);
      const cashback    = rows[i][6] ? Number(rows[i][6]) : 0; // Columna G (opcional)

      const data = {
        id:          String(rows[i][0]).trim(),
        nombre:      String(rows[i][1]),
        rut:         String(rows[i][2]),
        telefono:    String(rows[i][3]),
        fechaInicio: formatDate(fechaInicio),
        plan:        String(rows[i][5]),
        meses:       meses,
        nivel:       nivel,
        cashback:    cashback
      };

      return jsonResponse(data);
    }

    return jsonError('Cliente no encontrado');

  } catch (err) {
    return jsonError('Error interno: ' + err.message);
  }
}

function calcMeses(fecha) {
  const inicio = (fecha instanceof Date) ? fecha : new Date(String(fecha));
  const hoy    = new Date();
  const meses  = (hoy.getFullYear() - inicio.getFullYear()) * 12
               + (hoy.getMonth()    - inicio.getMonth());
  return Math.max(0, meses);
}

function calcNivel(meses) {
  if (meses >= 12) return 'premium';
  if (meses >= 6)  return 'plus';
  return 'miembro';
}

function formatDate(fecha) {
  if (fecha instanceof Date) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  return String(fecha);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
