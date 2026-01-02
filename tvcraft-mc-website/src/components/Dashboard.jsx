// src/components/Dashboard.jsx - NUEVO COMPONENTE

import React from 'react'
import { useAuth } from '../context/AuthContext'
import { dbSync } from '../lib/dbSync'

const Dashboard = () => {
  const { user, userData, refreshUserData } = useAuth()

  const handleTestPurchase = async () => {
    try {
      const purchaseData = {
        compra_id: `TEST_${Date.now()}`,
        producto: 'Pack de Prueba',
        monto: 19.99,
        tcoins_obtenidos: 200,
        metodo_pago: 'Tarjeta de Prueba'
      }

      await dbSync.registerPurchase(user.id, purchaseData)
      await refreshUserData()
      alert('Compra de prueba realizada con éxito!')
    } catch (error) {
      console.error('Error en compra:', error)
      alert('Error al realizar la compra')
    }
  }

  if (!user) {
    return <div>Por favor, inicia sesión</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Dashboard de {userData?.username || user.email}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Tarjeta de Tcoins */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-semibold mb-2">Tcoins</h3>
            <p className="text-3xl font-bold text-blue-600">
              {userData?.tcoins || 0}
            </p>
          </div>

          {/* Tarjeta de Estadísticas si existen */}
          {userData?.stats && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Gastado</h3>
                <p className="text-3xl font-bold text-green-600">
                  ${userData.stats.total_compras || 0}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-semibold mb-2">Compras</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {userData.stats.cantidad_compras || 0}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-semibold mb-2">Categoría</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {userData.stats.categoria_comprador || 'NOVATO'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Botones de acción */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Acciones Rápidas</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleTestPurchase}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Probar Compra ($19.99)
            </button>

            <button
              onClick={refreshUserData}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Actualizar Datos
            </button>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Información del Perfil</h2>
          <div className="space-y-2">
            <p><span className="font-semibold">Email:</span> {user.email}</p>
            <p><span className="font-semibold">Usuario:</span> {userData?.username || 'No establecido'}</p>
            <p><span className="font-semibold">ID:</span> {user.id}</p>
            <p><span className="font-semibold">Registrado:</span> {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard