// src/lib/supabaseClients.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Configuración de la Base de Datos 1 (usuarios)
const supabaseUrl1 = 'https://auokdrhbpyyjsszadvsc.supabase.co'
const supabaseKey1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2tkcmhicHl5anNzemFkdnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzUyMzYsImV4cCI6MjA4MDkxMTIzNn0.kJxv7R7_xhHC8PtyiqGVeAfRUqPZcFVyu2Q00payaeU'

// Configuración de la Base de Datos 2 (estadísticas)
const supabaseUrl2 = 'https://pkoupaqiylzmkxczoaot.supabase.co'
const supabaseKey2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrb3VwYXFpeWx6bWt4Y3pvYW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzU5MDUsImV4cCI6MjA4MjkxMTkwNX0.4OU_b2D0clFYb9CXnbO0P7YQQ5xyAEwC41rie4INNNY'

// Crear clientes
export const supabase = createClient(supabaseUrl1, supabaseKey1)
export const supabaseStats = createClient(supabaseUrl2, supabaseKey2)

// Hacer disponibles globalmente para archivos .js tradicionales
window.supabase = supabase
window.supabase2 = supabaseStats

console.log('Supabase clients configurados correctamente')