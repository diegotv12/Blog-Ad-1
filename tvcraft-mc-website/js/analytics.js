import { supabase1, supabase2 } from './main.js';

// Función para cargar analytics en el panel admin
export async function loadAnalytics() {
    try {
        // Cargar analytics de los últimos 30 días
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [
            dailyStats,
            topProducts,
            userActivity,
            revenueStats,
            tcoinsStats
        ] = await Promise.all([
            // Estadísticas diarias de BD1
            supabase1
                .from('daily_analytics')
                .select('*')
                .order('fecha', { ascending: false })
                .limit(30),

            // Productos más vendidos
            supabase1
                .rpc('get_top_products'), // Necesitarías crear esta función

            // Actividad de usuarios (BD2)
            supabase2
                .from('user_events')
                .select('event_type, created_at')
                .gte('created_at', thirtyDaysAgo),

            // Estadísticas de ingresos
            supabase1
                .from('purchases')
                .select('price_paid_usd, created_at, status')
                .eq('status', 'completed')
                .gte('created_at', thirtyDaysAgo),

            // Estadísticas de TCoins
            supabase1
                .from('tcoins_transactions')
                .select('amount, type, created_at')
                .gte('created_at', thirtyDaysAgo)
        ]);

        return {
            dailyStats: dailyStats.data || [],
            topProducts: topProducts.data || [],
            userActivity: userActivity.data || [],
            revenueStats: revenueStats.data || [],
            tcoinsStats: tcoinsStats.data || []
        };

    } catch (error) {
        console.error('Error loading analytics:', error);
        return null;
    }
}

// Función para generar reporte manual
export async function generateManualReport(startDate, endDate) {
    try {
        const { data, error } = await supabase1
            .rpc('generate_custom_report', {
                start_date: startDate,
                end_date: endDate
            });

        if (error) throw error;

        return data;

    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
}