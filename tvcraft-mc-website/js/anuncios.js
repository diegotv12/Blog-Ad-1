// Variables globales
let adTimer = null;
let adSeconds = 30;
let adProgress = 0;
let canWatchAd = true;
let adCooldown = 3600000; // 1 hora en milisegundos
let lastAdWatched = null;

// Inicializar sistema de anuncios
document.addEventListener('DOMContentLoaded', async () => {
    await initializeAdsSystem();
    setupAdControls();
    updateAdsStats();
});

// Inicializar sistema de anuncios
async function initializeAdsSystem() {
    if (!window.currentUser) {
        showLoginRequired();
        return;
    }
    
    try {
        // Verificar cooldown del último anuncio
        await checkAdCooldown();
        
        // Cargar estadísticas del usuario
        await loadUserAdsStats();
        
    } catch (error) {
        console.error('Error al inicializar sistema de anuncios:', error);
    }
}

// Mostrar mensaje de inicio de sesión requerido
function showLoginRequired() {
    const adsCard = document.getElementById('adsCard');
    if (!adsCard) return;
    
    adsCard.innerHTML = `
        <div class="ads-icon">
            <i class="fas fa-user-lock"></i>
        </div>
        
        <h3>Inicia Sesión</h3>
        <p>Debes iniciar sesión para ver anuncios y ganar TCoins</p>
        
        <div style="margin-top: 2rem;">
            <a href="login.html?redirect=anuncios.html" class="btn btn-primary" style="width: 100%;">
                <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
            </a>
        </div>
        
        <div style="margin-top: 1rem;">
            <a href="register.html" class="btn btn-outline" style="width: 100%;">
                <i class="fas fa-user-plus"></i> Registrarse
            </a>
        </div>
    `;
}

// Verificar cooldown del último anuncio
async function checkAdCooldown() {
    try {
        if (!window.supabase2) {
            console.warn('DB2 no disponible para cooldown');
            return;
        }
        
        // Obtener último anuncio visto del usuario
        const { data: lastAd, error } = await window.supabase2
            .from('ads_history')
            .select('timestamp')
            .eq('user_id', window.currentUser.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error al verificar cooldown:', error);
            return;
        }
        
        if (lastAd) {
            lastAdWatched = new Date(lastAd.timestamp);
            const now = new Date();
            const timeSinceLastAd = now - lastAdWatched;
            
            if (timeSinceLastAd < adCooldown) {
                canWatchAd = false;
                const remainingTime = adCooldown - timeSinceLastAd;
                updateCooldownDisplay(remainingTime);
                
                // Iniciar contador de cooldown
                startCooldownTimer(remainingTime);
            }
        }
        
    } catch (error) {
        console.error('Error en checkAdCooldown:', error);
    }
}

// Cargar estadísticas de anuncios del usuario
async function loadUserAdsStats() {
    try {
        if (!window.supabase2) {
            // Usar datos locales si DB2 no está disponible
            updateStatsDisplay(0, 0, 0);
            return;
        }
        
        // Contar anuncios vistos hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: todayAds, error: todayError } = await window.supabase2
            .from('ads_history')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .gte('timestamp', today.toISOString());
        
        // Contar total de anuncios vistos
        const { data: totalAds, error: totalError } = await window.supabase2
            .from('ads_history')
            .select('*')
            .eq('user_id', window.currentUser.id);
        
        // Calcular TCoins ganados (50 TCoins por anuncio)
        const totalCoins = (totalAds?.length || 0) * 50;
        
        updateStatsDisplay(
            totalAds?.length || 0,
            totalCoins,
            todayAds?.length || 0
        );
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        updateStatsDisplay(0, 0, 0);
    }
}

// Actualizar visualización de estadísticas
function updateStatsDisplay(totalAds, totalCoins, todayAds) {
    const totalAdsEl = document.getElementById('totalAds');
    const totalCoinsEl = document.getElementById('totalCoins');
    const todayAdsEl = document.getElementById('todayAds');
    
    if (totalAdsEl) totalAdsEl.textContent = totalAds;
    if (totalCoinsEl) totalCoinsEl.textContent = totalCoins;
    if (todayAdsEl) todayAdsEl.textContent = todayAds;
}

// Configurar controles de anuncios
function setupAdControls() {
    const startAdBtn = document.getElementById('startAdBtn');
    if (!startAdBtn) return;
    
    startAdBtn.addEventListener('click', startAd);
}

// Iniciar anuncio
function startAd() {
    if (!canWatchAd) {
        showError('Debes esperar antes de ver otro anuncio. Revisa el temporizador.');
        return;
    }
    
    if (!window.currentUser) {
        showError('Debes iniciar sesión para ver anuncios');
        return;
    }
    
    // Deshabilitar botón
    const startAdBtn = document.getElementById('startAdBtn');
    startAdBtn.disabled = true;
    startAdBtn.innerHTML = '<i class="fas fa-play"></i> Anuncio en curso...';
    
    // Resetear temporizador
    adSeconds = 30;
    adProgress = 0;
    
    // Actualizar display
    const timerEl = document.getElementById('timer');
    const progressFill = document.getElementById('progressFill');
    
    if (timerEl) timerEl.textContent = adSeconds;
    if (progressFill) progressFill.style.width = '0%';
    
    // Ocultar info de cooldown
    const cooldownInfo = document.getElementById('cooldownInfo');
    if (cooldownInfo) cooldownInfo.style.display = 'none';
    
    // Iniciar temporizador
    adTimer = setInterval(() => {
        adSeconds--;
        adProgress = ((30 - adSeconds) / 30) * 100;
        
        // Actualizar display
        if (timerEl) timerEl.textContent = adSeconds;
        if (progressFill) progressFill.style.width = `${adProgress}%`;
        
        // Completado
        if (adSeconds <= 0) {
            completeAd();
        }
    }, 1000);
}

// Completar anuncio
async function completeAd() {
    // Limpiar temporizador
    if (adTimer) {
        clearInterval(adTimer);
        adTimer = null;
    }
    
    // Actualizar display
    const timerEl = document.getElementById('timer');
    const startAdBtn = document.getElementById('startAdBtn');
    
    if (timerEl) {
        timerEl.textContent = '¡Listo!';
        timerEl.classList.add('timer-complete');
    }
    
    if (startAdBtn) {
        startAdBtn.disabled = false;
        startAdBtn.innerHTML = '<i class="fas fa-check"></i> Anuncio Completado';
    }
    
    try {
        // Registrar anuncio visto y otorgar recompensa
        await registerAdWatched();
        
        // Mostrar mensaje de éxito
        showSuccess('¡Anuncio completado! Has ganado 50 TCoins.', () => {
            // Resetear botón después de 3 segundos
            setTimeout(() => {
                if (startAdBtn) {
                    startAdBtn.innerHTML = '<i class="fas fa-play"></i> Iniciar Anuncio';
                    startAdBtn.disabled = false;
                }
                
                // Resetear timer
                if (timerEl) {
                    timerEl.textContent = '30';
                    timerEl.classList.remove('timer-complete');
                }
                
                // Resetear progress bar
                const progressFill = document.getElementById('progressFill');
                if (progressFill) progressFill.style.width = '0%';
                
                // Actualizar cooldown
                canWatchAd = false;
                lastAdWatched = new Date();
                updateCooldownDisplay(adCooldown);
                startCooldownTimer(adCooldown);
                
                // Actualizar estadísticas
                loadUserAdsStats();
                
            }, 3000);
        });
        
    } catch (error) {
        console.error('Error al completar anuncio:', error);
        showError('Error al procesar la recompensa. Intenta de nuevo.');
        
        // Resetear botón
        if (startAdBtn) {
            startAdBtn.innerHTML = '<i class="fas fa-play"></i> Iniciar Anuncio';
            startAdBtn.disabled = false;
        }
    }
}

// Registrar anuncio visto
async function registerAdWatched() {
    const rewardAmount = 50;
    const now = new Date().toISOString();
    
    try {
        // 1. Actualizar TCoins en DB1
        if (window.supabase && window.currentUser) {
            // Obtener saldo actual
            const { data: profile, error: profileError } = await window.supabase
                .from('profiles')
                .select('tcoins')
                .eq('id', window.currentUser.id)
                .single();
            
            if (profileError) throw profileError;
            
            const newBalance = (profile.tcoins || 0) + rewardAmount;
            
            // Actualizar saldo
            const { error: updateError } = await window.supabase
                .from('profiles')
                .update({ tcoins: newBalance })
                .eq('id', window.currentUser.id);
            
            if (updateError) throw updateError;
            
            // Registrar transacción
            const { error: transError } = await window.supabase
                .from('tcoins_transactions')
                .insert({
                    user_id: window.currentUser.id,
                    amount: rewardAmount,
                    type: 'anuncio',
                    description: 'Recompensa por ver anuncio',
                    balance_after: newBalance,
                    created_at: now
                });
            
            if (transError) throw transError;
        }
        
        // 2. Registrar en DB2 si está disponible
        if (window.supabase2 && window.currentUser) {
            // Registrar en ads_history
            const { error: adHistoryError } = await window.supabase2
                .from('ads_history')
                .insert({
                    user_id: window.currentUser.id,
                    reward_tcoins: rewardAmount,
                    timestamp: now,
                    ad_duration: 30
                });
            
            if (adHistoryError) console.warn('Error en ads_history:', adHistoryError);
            
            // Registrar evento
            const { error: eventError } = await window.supabase2
                .from('user_events')
                .insert({
                    user_id: window.currentUser.id,
                    event_type: 'ad_watched',
                    event_data: { reward: rewardAmount, duration: 30 },
                    created_at: now
                });
            
            if (eventError) console.warn('Error en user_events:', eventError);
        }
        
        return true;
        
    } catch (error) {
        console.error('Error en registerAdWatched:', error);
        throw error;
    }
}

// Actualizar display de cooldown
function updateCooldownDisplay(remainingMs) {
    const cooldownInfo = document.getElementById('cooldownInfo');
    const cooldownText = document.getElementById('cooldownText');
    
    if (!cooldownInfo || !cooldownText) return;
    
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    
    cooldownText.textContent = `Podrás ver otro anuncio en: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    cooldownInfo.style.display = 'flex';
}

// Iniciar temporizador de cooldown
function startCooldownTimer(remainingMs) {
    const cooldownInterval = setInterval(() => {
        remainingMs -= 1000;
        
        if (remainingMs <= 0) {
            clearInterval(cooldownInterval);
            canWatchAd = true;
            
            const cooldownInfo = document.getElementById('cooldownInfo');
            const startAdBtn = document.getElementById('startAdBtn');
            
            if (cooldownInfo) cooldownInfo.style.display = 'none';
            if (startAdBtn) startAdBtn.disabled = false;
            
            return;
        }
        
        updateCooldownDisplay(remainingMs);
    }, 1000);
}

// Función para simular anuncio (para desarrollo)
function simulateAd() {
    if (!canWatchAd) {
        alert('Debes esperar antes de ver otro anuncio');
        return;
    }
    
    startAd();
}

// Exportar para desarrollo
window.simulateAd = simulateAd;
window.startAd = startAd;