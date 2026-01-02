// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sesión activa
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Sesión actual:', session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error al verificar sesión:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Cambio de autenticación:', event, session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, username) => {
    try {
      console.log('Intentando registrar:', { email, username })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      console.log('Respuesta signUp:', { data, error })

      if (error) {
        throw error
      }

      if (data.user) {
        // Crear perfil en la tabla 'cuentas'
        const { error: profileError } = await supabase
          .from('cuentas')
          .insert({
            id: data.user.id,
            email: email,
            username: username,
            password_hash: '', // La autenticación la maneja Supabase
            foto_perfil_url: 'https://via.placeholder.com/150',
            tcoins: 100 // Bonificación inicial
          })

        if (profileError) {
          console.error('Error al crear perfil:', profileError)
          // No lanzamos error para no interrumpir el registro
        }

        setUser(data.user)
      }

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error en signUp:', error)
      return { success: false, data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      console.log('Intentando iniciar sesión:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('Respuesta signIn:', { data, error })

      if (error) throw error

      setUser(data.user)
      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error en signIn:', error)
      return { success: false, data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      return { success: true, error: null }
    } catch (error) {
      console.error('Error en signOut:', error)
      return { success: false, error }
    }
  }

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}