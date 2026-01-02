// js/auth.js - ACTUALIZADO

import { supabase } from '../src/lib/supabaseClients.js'

const auth = {
  // Iniciar sesión
  async signIn(email, password) {
    try {
      console.log('Intentando iniciar sesión:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Error signIn:', error)
        return { success: false, error: error.message }
      }

      console.log('Inicio de sesión exitoso:', data.user.email)
      
      // Guardar en localStorage para uso en otros scripts
      localStorage.setItem('user_email', data.user.email)
      localStorage.setItem('user_id', data.user.id)
      
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error catch signIn:', error)
      return { success: false, error: 'Error al iniciar sesión' }
    }
  },

  // Registrarse
  async signUp(email, password, username) {
    try {
      console.log('Intentando registrar:', { email, username })
      
      // 1. Registrar en auth de Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (authError) {
        console.error('Error en auth signUp:', authError)
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'No se creó el usuario' }
      }

      console.log('Auth creado, ID:', authData.user.id)
      
      // 2. Crear perfil en tabla 'cuentas'
      const { error: profileError } = await supabase
        .from('cuentas')
        .insert({
          id: authData.user.id,
          email: email,
          username: username,
          password_hash: '', // La maneja Supabase auth
          foto_perfil_url: 'https://via.placeholder.com/150',
          tcoins: 100, // Bonificación inicial
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error al crear perfil:', profileError)
        // No lanzamos error completo para que el usuario pueda intentar login
      }

      // 3. Sincronizar con segunda base de datos (si existe la función)
      try {
        if (window.syncUserWithStats) {
          await window.syncUserWithStats(authData.user.id, email, username)
        }
      } catch (syncError) {
        console.warn('Error en sincronización con stats:', syncError)
        // No bloqueamos el registro por este error
      }

      return { 
        success: true, 
        user: authData.user,
        message: 'Cuenta creada exitosamente. Ahora puedes iniciar sesión.'
      }
    } catch (error) {
      console.error('Error catch signUp:', error)
      return { success: false, error: 'Error al crear la cuenta' }
    }
  },

  // Cerrar sesión
  async signOut() {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('user_email')
      localStorage.removeItem('user_id')
      return { success: true }
    } catch (error) {
      console.error('Error signOut:', error)
      return { success: false, error: error.message }
    }
  },

  // Verificar sesión activa
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error getCurrentUser:', error)
      return null
    }
  },

  // Verificar si está autenticado
  isAuthenticated() {
    const user = this.getCurrentUser()
    return !!user
  },

  // Obtener datos del usuario
  async getUserData() {
    try {
      const user = await this.getCurrentUser()
      if (!user) return null

      // Obtener datos de la tabla cuentas
      const { data, error } = await supabase
        .from('cuentas')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getUserData:', error)
      return null
    }
  }
}

export default auth

// Para uso global en otros scripts
window.authModule = auth