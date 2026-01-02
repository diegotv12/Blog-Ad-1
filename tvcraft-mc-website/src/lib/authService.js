// src/lib/authService.js

import { supabase1, supabase2 } from './supabaseClients'
import { DatabaseSync } from '../../lib/dbSync'

export const authService = {
  async signUp(email, password, username) {
    try {
      // 1. Registrar en cuenta1 (autenticación)
      const { data: authData, error: authError } = await supabase1.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      })

      if (authError) throw authError

      // 2. Crear perfil en cuenta1
      const { error: profileError } = await supabase1
        .from('cuentas')
        .insert({
          id: authData.user.id,
          email: email,
          username: username,
          password_hash: '', // Supabase Auth maneja esto
          foto_perfil_url: 'https://via.placeholder.com/150',
          tcoins: 100 // Bonificación de registro
        })

      if (profileError) throw profileError

      // 3. Sincronizar con cuenta2
      await DatabaseSync.syncUserOnRegister(authData.user.id, email, username)

      return authData
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  },

  async signIn(email, password) {
    const { data, error } = await supabase1.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase1.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase1.auth.getUser()
    return user
  }
}