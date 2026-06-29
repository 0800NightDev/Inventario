const ExcelJS = require('exceljs');
const { getSupabase } = require('./_shared/supabase');
const { requireRole } = require('./_shared/auth');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  // Solo admin o superusuario
  const user = requireRole(event, ['administrador', 'superusuario']);
  if (user.statusCode) return { ...user, headers: { ...headers, 'Content-Type': 'application/json' } };

  try {
    const supabase = getSupabase();

    // ── Obtener datos del inventario ──
    const { data: inventario, error: invErr } = await supabase
      .from('inventory')
      .select('*')
      .order('formato', { ascending: true })
      .order('tamano_placa', { ascending: true });

    if (invErr) throw invErr;

    // ── Obtener movimientos del mes actual ──
    const now = new Date();
    const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: movimientos, error: movErr } = await supabase
      .from('transactions')
      .select('*, user:users!transactions_user_id_fkey(username), admin:users!transactions_admin_id_fkey(username)')
      .gte('fecha', primerDiaMes)
      .lte('fecha', ultimoDiaMes)
      .order('fecha', { ascending: false });

    if (movErr) throw movErr;

    // ── Crear workbook de Excel ──
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventario Radiografía';
    workbook.created = now;

    // Estilo de encabezado oscuro
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'thin', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      }
    };

    // ═══════════════════════════════════════════════════════════
    // Hoja 1: Inventario Dashboard
    // ═══════════════════════════════════════════════════════════
    const sheetInv = workbook.addWorksheet('Inventario Dashboard');
    sheetInv.columns = [
      { header: 'Tamaño Placa', key: 'tamano_placa', width: 20 },
      { header: 'Formato', key: 'formato', width: 15 },
      { header: 'Total Cajas', key: 'cantidad_cajas', width: 15 },
      { header: 'Desglose', key: 'desglose', width: 25 }
    ];

    // Aplicar estilo al encabezado
    sheetInv.getRow(1).eachCell((cell) => {
      cell.font = headerStyle.font;
      cell.fill = headerStyle.fill;
      cell.alignment = headerStyle.alignment;
      cell.border = headerStyle.border;
    });
    sheetInv.getRow(1).height = 30;

    // Llenar datos de inventario
    (inventario || []).forEach((item) => {
      const bultos = Math.floor(item.cantidad_cajas / 5);
      const cajasSueltas = item.cantidad_cajas % 5;
      const desglose = `${bultos} bulto(s), ${cajasSueltas} caja(s)`;

      sheetInv.addRow({
        tamano_placa: item.tamano_placa,
        formato: item.formato,
        cantidad_cajas: item.cantidad_cajas,
        desglose
      });
    });

    // ═══════════════════════════════════════════════════════════
    // Hoja 2: Movimientos del Mes
    // ═══════════════════════════════════════════════════════════
    const sheetMov = workbook.addWorksheet('Movimientos del Mes');
    sheetMov.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Fecha', key: 'fecha', width: 22 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Trabajador', key: 'trabajador', width: 18 },
      { header: 'Tamaño', key: 'tamano_placa', width: 20 },
      { header: 'Formato', key: 'formato', width: 15 },
      { header: 'Cajas', key: 'cantidad_cajas', width: 10 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Admin', key: 'admin', width: 18 }
    ];

    // Aplicar estilo al encabezado
    sheetMov.getRow(1).eachCell((cell) => {
      cell.font = headerStyle.font;
      cell.fill = headerStyle.fill;
      cell.alignment = headerStyle.alignment;
      cell.border = headerStyle.border;
    });
    sheetMov.getRow(1).height = 30;

    // Llenar datos de movimientos
    (movimientos || []).forEach((mov) => {
      const fechaFormatted = mov.fecha
        ? new Date(mov.fecha).toLocaleString('es-VE', { timeZone: 'America/Caracas' })
        : '';

      sheetMov.addRow({
        id: mov.id,
        fecha: fechaFormatted,
        tipo: mov.tipo,
        trabajador: mov.user ? mov.user.username : '',
        tamano_placa: mov.tamano_placa,
        formato: mov.formato,
        cantidad_cajas: mov.cantidad_cajas,
        estado: mov.estado,
        admin: mov.admin ? mov.admin.username : ''
      });
    });

    // ── Generar buffer y retornar como base64 ──
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="inventario_${now.toISOString().split('T')[0]}.xlsx"`
      },
      body: base64,
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('Error en export-excel:', err);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error al generar el archivo Excel' })
    };
  }
};
