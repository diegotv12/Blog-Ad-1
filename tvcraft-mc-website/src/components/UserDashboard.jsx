// src/components/UserDashboard.jsx

import React from 'react'
import { useCombinedUserData } from '../assets/hooks/useCombinedUserData'
import { DatabaseSync } from '../lib/dbSync'

const UserDashboard = () => {
  const { userData, loading, error, refreshData } = useCombinedUserData()

  const handlePurchase = async () => {
    try {
      const purchaseData = {
        compra_id: `COMPRA_${Date.now()}`,
        producto: 'Pack Diamante',
        categoria: 'Premium',
        monto: 49.99,
        tcoins_obtenidos: 500,
        metodo_pago: 'PayPal'
      }

      await DatabaseSync.registerPurchase(userData.id, purchaseData)
      await refreshData()
      alert('Compra realizada con éxito!')
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Error al realizar la compra')
    }
  }

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>
  if (!userData) return <div>No autenticado</div>

  return (
    <div className="dashboard">
      <h1>Bienvenido, {userData.username}!</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Tcoins</h3>
          <p className="value">{userData.tcoins}</p>
        </div>

        {userData.estadisticas && (
          <>
            <div className="stat-card">
              <h3>Total Gastado</h3>
              <p className="value">${userData.estadisticas.total_compras}</p>
            </div>

            <div className="stat-card">
              <h3>Categoría</h3>
              <p className="value">{userData.estadisticas.categoria_comprador}</p>
            </div>

            <div className="stat-card">
              <h3>Anuncios Vistos</h3>
              <p className="value">{userData.estadisticas.anuncios_vistos_total}</p>
            </div>
          </>
        )}
      </div>

      <button onClick={handlePurchase} className="btn-primary">
        Comprar Pack Diamante
      </button>
    </div>
  )
}

export default UserDashboard