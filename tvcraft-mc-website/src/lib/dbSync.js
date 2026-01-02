// src/lib/dbSync.js

import { supabase1, supabase2 } from './supabaseClients'

export class DatabaseSync {
  // Sincronizar usuario de cuenta1 a cuenta2 cuando se registra
  static async syncUserOnRegister(userId, email, username) {
    try {
      // Verificar si el usuario ya existe en cuenta2
      const { data: existingUser } = await supabase2
        .from('cuenta2')
        .select('id')
        .eq('cuenta_id', userId)
        .single()

      if (existingUser) {
        return existingUser
      }

      // Crear usuario en cuenta2
      const { data, error } = await supabase2
        .from('cuenta2')
        .insert({
          cuenta_id: userId,
          email: email,
          username: username,
          cupones: [],
          registros_compra: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error syncing user:', error)
      throw error
    }
  }

  // Obtener datos combinados del usuario
  static async getUserCombinedData(userId) {
    try {
      const [user1Data, user2Data] = await Promise.all([
        // Datos de cuenta principal
        supabase1
          .from('cuentas')
          .select('*')
          .eq('id', userId)
          .single(),

        // Datos de cuenta secundaria
        supabase2
          .from('cuenta2')
          .select(`
            *,
            compras_detalle(*),
            cupones_canjeados(*),
            anuncios_vistos_log(*)
          `)
          .eq('cuenta_id', userId)
          .single()
      ])

      if (user1Data.error) throw user1Data.error
      if (user2Data.error && user2Data.error.code !== 'PGRST116') {
        throw user2Data.error
      }

      return {
        ...user1Data.data,
        estadisticas: user2Data.data || null
      }
    } catch (error) {
      console.error('Error getting combined data:', error)
      throw error
    }
  }

  // Registrar una compra en ambas bases de datos
  static async registerPurchase(userId, purchaseData) {
    try {
      const user1 = await supabase1
        .from('cuentas')
        .select('tcoins, username')
        .eq('id', userId)
        .single()

      if (user1.error) throw user1.error

      // 1. Actualizar tcoins en cuenta1
      const newTcoins = user1.data.tcoins + (purchaseData.tcoins_obtenidos || 0)
      const { error: updateError } = await supabase1
        .from('cuentas')
        .update({ 
          tcoins: newTcoins,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) throw updateError

      // 2. Obtener cuenta2_id
      const { data: cuenta2User } = await supabase2
        .from('cuenta2')
        .select('id')
        .eq('cuenta_id', userId)
        .single()

      if (!cuenta2User) {
        throw new Error('User not found in cuenta2')
      }

      // 3. Registrar compra detallada en cuenta2
      const { data: purchaseDetail } = await supabase2
        .from('compras_detalle')
        .insert({
          cuenta2_id: cuenta2User.id,
          compra_id: purchaseData.compra_id,
          producto: purchaseData.producto,
          categoria: purchaseData.categoria,
          monto: purchaseData.monto,
          tcoins_gastados: purchaseData.tcoins_gastados || 0,
          tcoins_obtenidos: purchaseData.tcoins_obtenidos || 0,
          metodo_pago: purchaseData.metodo_pago,
          estado: purchaseData.estado || 'COMPLETADO',
          detalles: purchaseData.detalles || {}
        })
        .select()
        .single()

      if (purchaseDetail.error) throw purchaseDetail.error

      // 4. Actualizar estadísticas en cuenta2
      await this.updateUserStats(userId, purchaseData.monto)

      return { success: true, tcoins: newTcoins, purchase: purchaseDetail.data }
    } catch (error) {
      console.error('Error registering purchase:', error)
      throw error
    }
  }

  // Actualizar estadísticas del usuario
  static async updateUserStats(userId, purchaseAmount = 0) {
    try {
      const { data: cuenta2User } = await supabase2
        .from('cuenta2')
        .select('id, total_compras, cantidad_compras, compra_mas_alta')
        .eq('cuenta_id', userId)
        .single()

      if (!cuenta2User) return

      const newTotal = parseFloat(cuenta2User.total_compras) + parseFloat(purchaseAmount)
      const newCount = cuenta2User.cantidad_compras + 1
      const newHighest = Math.max(cuenta2User.compra_mas_alta || 0, purchaseAmount)
      const newAverage = newTotal / newCount

      // Calcular categoría
      const categoria = this.calculateBuyerCategory(newTotal)

      // Actualizar cuenta2
      await supabase2
        .from('cuenta2')
        .update({
          total_compras: newTotal,
          cantidad_compras: newCount,
          compra_mas_alta: newHighest,
          promedio_compra: newAverage,
          categoria_comprador: categoria,
          updated_at: new Date().toISOString()
        })
        .eq('cuenta_id', userId)

      // Actualizar top compradores si aplica
      if (newTotal >= 10) { // Mínimo para entrar en ranking
        await this.updateTopBuyers(userId, newTotal, newCount)
      }
    } catch (error) {
      console.error('Error updating stats:', error)
    }
  }

  static calculateBuyerCategory(total) {
    if (total >= 1000) return 'DIAMANTE'
    if (total >= 500) return 'ORO'
    if (total >= 100) return 'PLATA'
    if (total >= 50) return 'BRONCE'
    if (total >= 10) return 'HIERRO'
    return 'NOVATO'
  }

  // Registrar visualización de anuncio
  static async registerAdView(userId, adData) {
    try {
      const { data: cuenta2User } = await supabase2
        .from('cuenta2')
        .select('id')
        .eq('cuenta_id', userId)
        .single()

      if (!cuenta2User) return null

      // 1. Registrar en el log
      const { data: adLog } = await supabase2
        .from('anuncios_vistos_log')
        .insert({
          cuenta2_id: cuenta2User.id,
          anuncio_id: adData.anuncio_id,
          tipo_anuncio: adData.tipo_anuncio,
          duracion_visto: adData.duracion_visto,
          tcoins_obtenidos: adData.tcoins_obtenidos || 5, // Valor por defecto
          plataforma: adData.plataforma || 'web',
          dispositivo: adData.dispositivo || navigator.userAgent
        })
        .select()
        .single()

      // 2. Actualizar tcoins en cuenta1
      const user1 = await supabase1
        .from('cuentas')
        .select('tcoins')
        .eq('id', userId)
        .single()

      if (!user1.error) {
        const newTcoins = user1.data.tcoins + (adData.tcoins_obtenidos || 5)
        await supabase1
          .from('cuentas')
          .update({ tcoins: newTcoins })
          .eq('id', userId)
      }

      // 3. Actualizar estadísticas en cuenta2
      await supabase2
        .from('cuenta2')
        .update({
          anuncios_vistos_total: supabase2.rpc('increment', { 
            table: 'cuenta2',
            column: 'anuncios_vistos_total',
            value: 1 
          }),
          anuncios_vistos_hoy: supabase2.rpc('increment', {
            table: 'cuenta2',
            column: 'anuncios_vistos_hoy',
            value: 1
          }),
          ultimo_anuncio_visto: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('cuenta_id', userId)

      return adLog.data
    } catch (error) {
      console.error('Error registering ad view:', error)
      throw error
    }
  }

  // Obtener top compradores
  static async getTopBuyers(limit = 10) {
    try {
      const { data, error } = await supabase2
        .from('top_compradores_global')
        .select('*')
        .order('total_gastado', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting top buyers:', error)
      return []
    }
  }
}