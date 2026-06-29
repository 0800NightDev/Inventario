const { getSupabase } = require('./_shared/supabase');
const { requireAuth, requireRole } = require('./_shared/auth');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Mapeo de etiquetas de tamaño a nombres estándar
const TAMANO_MAP = {
  '14x14': '14x14',
  '14x17': '14x17',
  '10x14': '10x14 (26x36)',
  '10x12': '10x12'
};

function mapTamano(label) {
  return TAMANO_MAP[label] || label;
}

// ══════════════════════════════════════════════════════════════
// Handler principal — despacha por método HTTP
// ══════════════════════════════════════════════════════════════
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(event);
      case 'POST':
        return await handlePost(event);
      case 'PUT':
        return await handlePut(event);
      case 'DELETE':
        return await handleDelete(event);
      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
    }
  } catch (err) {
    console.error('Error en transactions:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};

// ══════════════════════════════════════════════════════════════
// GET — listar transacciones según tipo
// ══════════════════════════════════════════════════════════════
async function handleGet(event) {
  const user = requireAuth(event);
  if (user.statusCode) return { ...user, headers };

  const params = event.queryStringParameters || {};
  const type = params.type || 'pending';
  const supabase = getSupabase();

  switch (type) {
    case 'pending': {
      // Transacciones pendientes con info del usuario
      const { data, error } = await supabase
        .from('transactions')
        .select('*, user:users!transactions_user_id_fkey(id, username)')
        .eq('estado', 'pendiente')
        .order('fecha', { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data || []) };
    }

    case 'approved': {
      const limit = parseInt(params.limit) || 50;
      const { data, error } = await supabase
        .from('transactions')
        .select('*, user:users!transactions_user_id_fkey(id, username), admin:users!transactions_admin_id_fkey(id, username)')
        .eq('estado', 'aprobada')
        .order('fecha', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data || []) };
    }

    case 'assigned': {
      const userId = params.user_id;
      if (!userId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id es requerido' }) };
      }
      const { data, error } = await supabase
        .from('transactions')
        .select('*, user:users!transactions_user_id_fkey(id, username)')
        .eq('estado', 'asignado')
        .eq('user_id', userId)
        .eq('tipo', 'egreso')
        .order('fecha', { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data || []) };
    }

    case 'all_approved': {
      // Para datos de gráficos — todas las transacciones aprobadas
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('estado', 'aprobada')
        .order('fecha', { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data || []) };
    }

    default:
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Tipo no válido: ${type}` }) };
  }
}

// ══════════════════════════════════════════════════════════════
// POST — crear transacción(es)
// ══════════════════════════════════════════════════════════════
async function handlePost(event) {
  const user = requireAuth(event);
  if (user.statusCode) return { ...user, headers };

  const params = event.queryStringParameters || {};
  const action = params.action || 'create';

  if (action !== 'create') {
    return { statusCode: 400, headers, body: JSON.stringify({ error: `Acción POST no válida: ${action}` }) };
  }

  const body = JSON.parse(event.body || '{}');
  const { tipo, items, fecha_vencimiento, imagen_path, fecha_manual, foto } = body;

  if (!tipo || !items || !Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'tipo e items son requeridos' })
    };
  }

  const supabase = getSupabase();
  const isAdmin = ['administrador', 'superusuario'].includes(user.role);

  // Subir foto si viene en base64
  let imagenFilename = imagen_path || null;
  if (foto && typeof foto === 'object' && foto.data) {
    const ext = (foto.name || 'comprobante.jpg').split('.').pop().toLowerCase();
    const allowedExts = ['png', 'jpg', 'jpeg', 'gif'];
    if (!allowedExts.includes(ext)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Tipo de archivo de foto no permitido. Formatos válidos: PNG, JPG, JPEG, GIF.' })
      };
    }

    imagenFilename = `libre_${user.id}_${Date.now()}.${ext}`;
    const fileBuffer = Buffer.from(foto.data, 'base64');
    const { error: uploadErr } = await supabase.storage
      .from('uploads')
      .upload(imagenFilename, fileBuffer, {
        contentType: foto.type || `image/${ext}`,
        upsert: false
      });

    if (uploadErr) {
      console.error('Error subiendo foto de operacion libre:', uploadErr);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error al subir la foto de comprobante al Storage' })
      };
    }
  }

  // Determinar la fecha a usar
  let fecha = new Date().toISOString();
  if (fecha_manual && isAdmin) {
    fecha = new Date(fecha_manual).toISOString();
  }

  const createdTransactions = [];

  for (const item of items) {
    const totalCajas = parseInt(item.cantidad_cajas) || 0;
    if (totalCajas <= 0) continue;

    const tamano = mapTamano(item.tamano_placa);
    const formato = item.formato;

    if (tipo === 'ingreso' && isAdmin) {
      // Ingresos de admin van directo a aprobada + actualizar inventario
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
          tipo,
          user_id: user.id,
          admin_id: user.id,
          tamano_placa: tamano,
          formato,
          fecha_vencimiento: fecha_vencimiento || null,
          cantidad_cajas: totalCajas,
          fecha,
          imagen_path: imagenFilename,
          estado: 'aprobada'
        })
        .select()
        .single();

      if (txError) throw txError;

      // Actualizar inventario: buscar o crear registro
      await upsertInventory(supabase, tamano, formato, fecha_vencimiento, totalCajas);

      createdTransactions.push(tx);
    } else {
      // Egresos o transacciones de trabajadores van a pendiente
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
          tipo,
          user_id: user.id,
          admin_id: null,
          tamano_placa: tamano,
          formato,
          fecha_vencimiento: fecha_vencimiento || null,
          cantidad_cajas: totalCajas,
          fecha,
          imagen_path: imagenFilename,
          estado: 'pendiente'
        })
        .select()
        .single();

      if (txError) throw txError;
      createdTransactions.push(tx);
    }
  }

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      message: `Se crearon ${createdTransactions.length} transacción(es)`,
      transactions: createdTransactions
    })
  };
}

// ══════════════════════════════════════════════════════════════
// PUT — validar lote o confirmar pedido
// ══════════════════════════════════════════════════════════════
async function handlePut(event) {
  const params = event.queryStringParameters || {};
  const action = params.action;

  if (action === 'validate_batch') {
    return await handleValidateBatch(event);
  } else if (action === 'confirm_order') {
    return await handleConfirmOrder(event);
  } else {
    return { statusCode: 400, headers, body: JSON.stringify({ error: `Acción PUT no válida: ${action}` }) };
  }
}

// ── Validar lote (aprobar/rechazar) ──────────────────────────
async function handleValidateBatch(event) {
  const user = requireRole(event, ['administrador', 'superusuario']);
  if (user.statusCode) return { ...user, headers };

  const body = JSON.parse(event.body || '{}');
  const { lote_id, accion } = body;

  if (!lote_id || !accion) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'lote_id y accion son requeridos' }) };
  }

  if (!['aprobar', 'rechazar'].includes(accion)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'accion debe ser aprobar o rechazar' }) };
  }

  const supabase = getSupabase();

  // Buscar transacciones del lote: por imagen_path (lote) o por ID individual
  let transactions;
  const loteIdNum = parseInt(lote_id);

  if (!isNaN(loteIdNum)) {
    // Intentar buscar por ID individual primero
    const { data: singleTx, error: singleErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', loteIdNum)
      .in('estado', ['pendiente']);

    if (singleErr) throw singleErr;

    if (singleTx && singleTx.length > 0) {
      // Si la transacción tiene imagen_path, buscar todas las del mismo lote
      if (singleTx[0].imagen_path) {
        const { data: loteTxs, error: loteErr } = await supabase
          .from('transactions')
          .select('*')
          .eq('imagen_path', singleTx[0].imagen_path)
          .eq('estado', 'pendiente');

        if (loteErr) throw loteErr;
        transactions = loteTxs;
      } else {
        transactions = singleTx;
      }
    } else {
      transactions = [];
    }
  } else {
    // Buscar por imagen_path como identificador de lote
    const { data: loteTxs, error: loteErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('imagen_path', lote_id)
      .eq('estado', 'pendiente');

    if (loteErr) throw loteErr;
    transactions = loteTxs;
  }

  if (!transactions || transactions.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'No se encontraron transacciones pendientes para este lote' })
    };
  }

  // ── RECHAZAR ──
  if (accion === 'rechazar') {
    const txIds = transactions.map(tx => tx.id);
    const { error: updateErr } = await supabase
      .from('transactions')
      .update({ estado: 'rechazada', admin_id: user.id })
      .in('id', txIds);

    if (updateErr) throw updateErr;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: `Se rechazaron ${txIds.length} transacción(es)` })
    };
  }

  // ── APROBAR ──
  // PASO 1: Validar que TODOS los egresos tengan stock suficiente ANTES de modificar nada
  const egresos = transactions.filter(tx => tx.tipo === 'egreso');
  const erroresStock = [];

  for (const tx of egresos) {
    const { data: inv } = await supabase
      .from('inventory')
      .select('cantidad_cajas')
      .eq('tamano_placa', tx.tamano_placa)
      .eq('formato', tx.formato)
      .maybeSingle();

    const stockActual = inv ? inv.cantidad_cajas : 0;
    if (stockActual < tx.cantidad_cajas) {
      erroresStock.push(
        `Stock insuficiente para ${tx.tamano_placa} (${tx.formato}): disponible ${stockActual}, requerido ${tx.cantidad_cajas}`
      );
    }
  }

  // Si hay errores de stock, NO modificar nada y retornar error
  if (erroresStock.length > 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Stock insuficiente para aprobar el lote',
        detalles: erroresStock
      })
    };
  }

  // PASO 2: Aplicar cambios — stock validado para todos los ítems
  for (const tx of transactions) {
    if (tx.tipo === 'ingreso') {
      // Ingreso: sumar al inventario
      await upsertInventory(supabase, tx.tamano_placa, tx.formato, tx.fecha_vencimiento, tx.cantidad_cajas);
    } else if (tx.tipo === 'egreso') {
      // Egreso: restar del inventario
      await upsertInventory(supabase, tx.tamano_placa, tx.formato, tx.fecha_vencimiento, -tx.cantidad_cajas);
    }
  }

  // Actualizar estado de todas las transacciones del lote
  const txIds = transactions.map(tx => tx.id);
  const { error: updateErr } = await supabase
    .from('transactions')
    .update({ estado: 'aprobada', admin_id: user.id })
    .in('id', txIds);

  if (updateErr) throw updateErr;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: `Se aprobaron ${txIds.length} transacción(es)` })
  };
}

// ── Confirmar pedido (trabajador sube foto) ──────────────────
async function handleConfirmOrder(event) {
  const user = requireAuth(event);
  if (user.statusCode) return { ...user, headers };

  const body = JSON.parse(event.body || '{}');
  const { tx_id, imagen_path } = body;

  if (!tx_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'tx_id es requerido' }) };
  }

  const supabase = getSupabase();

  // Buscar la transacción
  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', tx_id)
    .single();

  if (txErr || !tx) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Transacción no encontrada' }) };
  }

  // Verificar que esté en estado asignado
  if (tx.estado !== 'asignado') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'La transacción no está en estado asignado' })
    };
  }

  // Verificar stock suficiente
  const { data: inv } = await supabase
    .from('inventory')
    .select('cantidad_cajas')
    .eq('tamano_placa', tx.tamano_placa)
    .eq('formato', tx.formato)
    .maybeSingle();

  const stockActual = inv ? inv.cantidad_cajas : 0;
  if (stockActual < tx.cantidad_cajas) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: `Stock insuficiente para ${tx.tamano_placa} (${tx.formato}): disponible ${stockActual}, requerido ${tx.cantidad_cajas}`
      })
    };
  }

  // Subir foto si se proporcionó como base64
  let imagenFilename = null;
  if (imagen_path && typeof imagen_path === 'object' && imagen_path.data) {
    const ext = (imagen_path.name || 'photo.jpg').split('.').pop().toLowerCase();
    const allowedExts = ['png', 'jpg', 'jpeg', 'gif'];
    if (!allowedExts.includes(ext)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Tipo de archivo no permitido' })
      };
    }

    imagenFilename = `confirmacion_${tx_id}_${Date.now()}.${ext}`;
    const fileBuffer = Buffer.from(imagen_path.data, 'base64');

    const { error: uploadErr } = await supabase.storage
      .from('uploads')
      .upload(imagenFilename, fileBuffer, {
        contentType: imagen_path.type || `image/${ext}`,
        upsert: false
      });

    if (uploadErr) {
      console.error('Error subiendo foto de confirmación:', uploadErr);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error al subir la foto de confirmación' })
      };
    }
  } else if (typeof imagen_path === 'string') {
    imagenFilename = imagen_path;
  }

  // Restar del inventario
  await upsertInventory(supabase, tx.tamano_placa, tx.formato, tx.fecha_vencimiento, -tx.cantidad_cajas);

  // Actualizar transacción: estado aprobada, imagen, fecha actual
  const { error: updateErr } = await supabase
    .from('transactions')
    .update({
      estado: 'aprobada',
      imagen_path: imagenFilename,
      fecha: new Date().toISOString()
    })
    .eq('id', tx_id);

  if (updateErr) throw updateErr;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Pedido confirmado exitosamente' })
  };
}

// ══════════════════════════════════════════════════════════════
// DELETE — eliminar transacción y revertir inventario
// ══════════════════════════════════════════════════════════════
async function handleDelete(event) {
  const user = requireRole(event, ['administrador', 'superusuario']);
  if (user.statusCode) return { ...user, headers };

  const params = event.queryStringParameters || {};
  const txId = params.tx_id;

  if (!txId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'tx_id es requerido' }) };
  }

  const supabase = getSupabase();

  // Buscar la transacción
  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', txId)
    .single();

  if (txErr || !tx) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Transacción no encontrada' }) };
  }

  // Si la transacción fue aprobada, revertir impacto en inventario
  if (tx.estado === 'aprobada') {
    if (tx.tipo === 'ingreso') {
      // Ingreso aprobado: restar las cajas del inventario
      await upsertInventory(supabase, tx.tamano_placa, tx.formato, tx.fecha_vencimiento, -tx.cantidad_cajas);
    } else if (tx.tipo === 'egreso') {
      // Egreso aprobado: devolver las cajas al inventario
      await upsertInventory(supabase, tx.tamano_placa, tx.formato, tx.fecha_vencimiento, tx.cantidad_cajas);
    }
  }

  // Eliminar imagen del storage si existe
  if (tx.imagen_path) {
    await supabase.storage.from('uploads').remove([tx.imagen_path]);
  }

  // Eliminar la transacción
  const { error: deleteErr } = await supabase
    .from('transactions')
    .delete()
    .eq('id', txId);

  if (deleteErr) throw deleteErr;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Transacción eliminada exitosamente' })
  };
}

// ══════════════════════════════════════════════════════════════
// Helper — buscar o crear registro de inventario y actualizar
// ══════════════════════════════════════════════════════════════
async function upsertInventory(supabase, tamano_placa, formato, fecha_vencimiento, cantidadDelta) {
  // Buscar registro existente
  let query = supabase
    .from('inventory')
    .select('id, cantidad_cajas')
    .eq('tamano_placa', tamano_placa)
    .eq('formato', formato);

  // Manejar fecha_vencimiento null
  if (fecha_vencimiento) {
    query = query.eq('fecha_vencimiento', fecha_vencimiento);
  } else {
    query = query.is('fecha_vencimiento', null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    // Actualizar cantidad existente
    const nuevaCantidad = Math.max(0, existing.cantidad_cajas + cantidadDelta);
    await supabase
      .from('inventory')
      .update({ cantidad_cajas: nuevaCantidad })
      .eq('id', existing.id);
  } else if (cantidadDelta > 0) {
    // Crear nuevo registro solo si estamos sumando
    await supabase
      .from('inventory')
      .insert({
        tamano_placa,
        formato,
        fecha_vencimiento: fecha_vencimiento || null,
        cantidad_cajas: cantidadDelta
      });
  }
}
