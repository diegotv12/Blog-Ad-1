// src/hooks/useCombinedUserData.js

import { useEffect, useState } from 'react'
import { supabase1 } from '../../lib/supabaseClients'
import { DatabaseSync } from '../../lib/dbSync'

export const useCombinedUserData = () => {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        const { data: { user } } = await supabase1.auth.getUser()
        
        if (!user) {
          if (mounted) setUserData(null)
          return
        }

        const combinedData = await DatabaseSync.getUserCombinedData(user.id)
        
        if (mounted) {
          setUserData(combinedData)
          setError(null)
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
        if (mounted) {
          setError(err.message)
          setUserData(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchUserData()

    // Suscribirse a cambios en autenticación
    const { data: authListener } = supabase1.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          fetchUserData()
        }
      }
    )

    return () => {
      mounted = false
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const refreshData = async () => {
    const { data: { user } } = await supabase1.auth.getUser()
    if (user) {
      const data = await DatabaseSync.getUserCombinedData(user.id)
      setUserData(data)
    }
  }

  return { userData, loading, error, refreshData }
}