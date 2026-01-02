import { supabase1, supabase2, currentUser, userProfile, showError, showSuccess } from './main.js';

// DOM Elements
const adsContainer = document.getElementById('adsContainer');
const timerDisplay = document.getElementById('timerDisplay');
const progressBar = document.getElementById('progressBar');
const startAdBtn = document.getElementById('startAdBtn');
const skipAdBtn = document.getElementById('skipAdBtn');
const claimRewardBtn = document.getElementById('claimRewardBtn');
const adsStats = document.getElementById('adsStats');
const cooldownInfo = document.getElementById('cooldownInfo');

// Configuración
const AD_DURATION = 30; // segundos
const COOLDOWN_MINUTES = 30;
const REWARD_TCOINS = 10;
const MAX_ADS_PER_DAY = 10;

// Estado
let adTimer = null;
let timeLeft = AD_DURATION;
let isAdPlaying = false;
let adsToday = 0;
let lastAdTime = null;
let canWatchAds = true;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await initAds();
    setupEventListeners();
});

// Inicializar Sistema de Anuncios
async function initAds() {
    const user = currentUser();
    
    if (!user) {
        window.location.href = 'login.html?redirect=anuncios.html';
        return;
    }
    
    await loadAdsStats();
    updateUI();
}

// Cargar Estadísticas de Anuncios
async function loadAdsStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Contar anuncios de hoy desde BD2
        const { data: todayAds, error: adsError } = await supabase2
            .from('ads_history')
            .select('watched_at')
            .eq('user_id', currentUser().id)
            .gte('watched_at', `${today}T00:00:00`)
            .lte('watched_at', `${today}T23:59:59`);
            
        if (adsError) throw adsError;
        
        adsToday = todayAds?.length || 0;
        
        // Obtener último anuncio
        const { data: lastAd, error: lastAdError } = await supabase2
            .from('ads_history')
            .select('watched_at')
            .eq('user_id', currentUser().id)
            .order('watched_at', { ascending: false })
            .limit(1)
            .single();
            
        if (!lastAdError && lastAd) {
            lastAdTime = new Date(lastAd.watched_at);
        }
        
        // Verificar cooldown
        checkCooldown();
        
        // Actualizar estadísticas
        updateStatsDisplay();
        
    } catch (error) {
        console.error('Error loading ads stats:', error);
    }
}

// Verificar Cooldown
function checkCooldown() {
    if (!lastAdTime) {
        canWatchAds = true;
        return;
    }
    
    const now = new Date();
    const diffMs = now - lastAdTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    canWatchAds = diffMinutes >= COOLDOWN_MINUTES && adsToday < MAX_ADS_PER_DAY;
    
    if (!canWatchAds) {
        if (adsToday >= MAX_ADS_PER_DAY) {
            showCooldownInfo('Límite diario alcanzado');
        } else {
            const remainingMinutes = COOLDOWN_MINUTES - diffMinutes;
            showCooldownInfo(`Espera ${remainingMinutes} minuto(s)`);
        }
    }
}

// Mostrar Info de Cooldown
function showCooldownInfo(message) {
    if (cooldownInfo) {
        cooldownInfo.textContent = message;
        cooldownInfo.style.display = 'block';
    }
}

// Actualizar Estadísticas
function updateStatsDisplay() {
    if (!adsStats) return;
    
    adsStats.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${adsToday}/${MAX_ADS_PER_DAY}</div>
                <div class="stat-label">Hoy</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${REWARD_TCOINS}</div>
                <div class="stat-label">TCoins por ad</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${COOLDOWN_MINUTES}m</div>
                <div class="stat-label">Espera</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(adsToday * REWARD_TCOINS).toLocaleString()}</div>
                <div class="stat-label">Ganados hoy</div>
            </div>
        </div>
    `;
}

// Configurar Event Listeners
function setupEventListeners() {
    if (startAdBtn) {
        startAdBtn.addEventListener('click', startAd);
    }
    
    if (skipAdBtn) {
        skipAdBtn.addEventListener('click', skipAd);
    }
    
    if (claimRewardBtn) {
        claimRewardBtn.addEventListener('click', claimReward);
    }
}

// Actualizar UI
function updateUI() {
    if (!startAdBtn || !skipAdBtn || !claimRewardBtn) return;
    
    if (!isAdPlaying) {
        // Estado inicial
        startAdBtn.disabled = !canWatchAds;
        startAdBtn.innerHTML = canWatchAds ? 
            '<span>▶️ Ver Anuncio (30s)</span>' : 
            '<span>⏳ Espera para ver</span>';
        
        skipAdBtn.style.display = 'none';
        claimRewardBtn.style.display = 'none';
        
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(AD_DURATION);
        }
        
        if (progressBar) {
            progressBar.style.width = '100%';
        }
    }
}

// Formatear Tiempo
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Iniciar Anuncio
function startAd() {
    if (!canWatchAds || isAdPlaying) return;
    
    isAdPlaying = true;
    timeLeft = AD_DURATION;
    
    // Actualizar UI
    startAdBtn.disabled = true;
    startAdBtn.style.display = 'none';
    skipAdBtn.style.display = 'inline-flex';
    
    // Simular anuncio
    simulateAd();
    
    // Iniciar temporizador
    adTimer = setInterval(() => {
        timeLeft--;
        
        // Actualizar display
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(timeLeft);
        }
        
        // Actualizar barra de progreso
        if (progressBar) {
            const percentage = ((AD_DURATION - timeLeft) / AD_DURATION) * 100;
            progressBar.style.width = `${percentage}%`;
            
            // Cambiar color según progreso
            if (percentage < 33) {
                progressBar.style.background = 'var(--milano-red)';
            } else if (percentage < 66) {
                progressBar.style.background = 'var(--pizazz)';
            } else {
                progressBar.style.background = 'var(--supernova)';
            }
        }
        
        // Mostrar botón de reclamar cuando termine
        if (timeLeft <= 0) {
            clearInterval(adTimer);
            adTimer = null;
            showRewardButton();
        }
    }, 1000);
}

// Simular Anuncio
function simulateAd() {
    if (!adsContainer) return;
    
    // Simular diferentes tipos de anuncios
    const adTemplates = [
        {
            type: 'video',
            content: `
                <div class="ad-simulation">
                    <div class="ad-header">
                        <span class="ad-badge">Anuncio</span>
                        <span class="ad-timer">30s</span>
                    </div>
                    <div class="ad-content">
                        <div class="ad-video-placeholder">
                            <div class="play-button">▶</div>
                            <div class="video-overlay">
                                <div class="advertiser">Patrocinador</div>
                                <div class="ad-title">¡Mejora tu experiencia!</div>
                            </div>
                        </div>
                        <div class="ad-footer">
                            <div class="ad-cta">Visita nuestro sitio web</div>
                            <div class="ad-info">Anuncio · TVCRAFT MC</div>
                        </div>
                    </div>
                </div>
            `
        },
        {
            type: 'game',
            content: `
                <div class="ad-simulation">
                    <div class="ad-header">
                        <span class="ad-badge">Juego Patrocinado</span>
                        <span class="ad-timer">30s</span>
                    </div>
                    <div class="ad-content">
                        <div class="game-preview">
                            <div class="game-screenshot">
                                <div class="game-ui">
                                    <div class="game-score">Puntuación: 0</div>
                                    <div class="game-controls">
                                        <button class="game-btn">↑</button>
                                        <button class="game-btn">↓</button>
                                    </div>
                                </div>
                            </div>
                            <div class="game-info">
                                <h3>¡Nuevo Juego!</h3>
                                <p>Descárgalo gratis</p>
                            </div>
                        </div>
                    </div>
                </div>
            `
        },
        {
            type: 'product',
            content: `
                <div class="ad-simulation">
                    <div class="ad-header">
                        <span class="ad-badge">Producto</span>
                        <span class="ad-timer">30s</span>
                    </div>
                    <div class="ad-content">
                        <div class="product-ad">
                            <div class="product-image">
                                <div class="product-tag">NUEVO</div>
                            </div>
                            <div class="product-details">
                                <h3>Producto Exclusivo</h3>
                                <p>¡Oferta por tiempo limitado!</p>
                                <div class="product-price">
                                    <span class="old-price">$99.99</span>
                                    <span class="new-price">$49.99</span>
                                </div>
                                <button class="btn btn-primary">Ver Oferta</button>
                            </div>
                        </div>
                    </div>
                </div>
            `
        }
    ];
    
    const randomAd = adTemplates[Math.floor(Math.random() * adTemplates.length)];
    
    adsContainer.innerHTML = randomAd.content;
    
    // Añadir estilos dinámicos
    const style = document.createElement('style');
    style.textContent = `
        .ad-simulation {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--card-radius);
            overflow: hidden;
            animation: fadeIn 0.5s ease;
        }
        
        .ad-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            background: var(--bg-hover);
            border-bottom: 1px solid var(--border-color);
        }
        
        .ad-badge {
            background: var(--supernova);
            color: var(--ebony);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .ad-timer {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .ad-content {
            padding: 20px;
        }
        
        .ad-video-placeholder {
            background: linear-gradient(45deg, var(--bg-hover), var(--bg-card));
            height: 200px;
            border-radius: var(--border-radius);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        
        .play-button {
            font-size: 3rem;
            color: var(--supernova);
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .video-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 12px;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            color: white;
        }
        
        .advertiser {
            font-size: 0.8rem;
            opacity: 0.8;
        }
        
        .ad-title {
            font-weight: 600;
            font-size: 1.1rem;
        }
        
        .ad-footer {
            margin-top: 1rem;
            text-align: center;
        }
        
        .ad-cta {
            color: var(--supernova);
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .ad-info {
            color: var(--text-secondary);
            font-size: 0.8rem;
        }
        
        .game-preview {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .game-screenshot {
            background: linear-gradient(45deg, #1a1a2e, #16213e);
            height: 180px;
            border-radius: var(--border-radius);
            position: relative;
            overflow: hidden;
        }
        
        .game-ui {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            display: flex;
            justify-content: space-between;
        }
        
        .game-score {
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 4px 12px;
            border-radius: var(--border-radius);
            font-size: 0.9rem;
        }
        
        .game-controls {
            display: flex;
            gap: 8px;
        }
        
        .game-btn {
            width: 40px;
            height: 40px;
            background: var(--supernova);
            border: none;
            border-radius: 50%;
            color: var(--ebony);
            font-weight: bold;
            cursor: pointer;
        }
        
        .product-ad {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .product-image {
            width: 120px;
            height: 120px;
            background: linear-gradient(45deg, var(--pizazz), var(--blaze-orange));
            border-radius: var(--border-radius);
            position: relative;
        }
        
        .product-tag {
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--milano-red);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        
        .product-details {
            flex: 1;
        }
        
        .product-price {
            margin: 1rem 0;
        }
        
        .old-price {
            text-decoration: line-through;
            color: var(--text-secondary);
            margin-right: 8px;
        }
        
        .new-price {
            color: var(--supernova);
            font-size: 1.5rem;
            font-weight: 700;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

// Saltar Anuncio
function skipAd() {
    if (!isAdPlaying || !adTimer) return;
    
    clearInterval(adTimer);
    adTimer = null;
    
    Swal.fire({
        title: '¿Saltar anuncio?',
        text: 'No recibirás TCoins si saltas el anuncio',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, saltar',
        cancelButtonText: 'Continuar viendo',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        confirmButtonColor: 'var(--milano-red)',
        cancelButtonColor: 'var(--supernova)'
    }).then((result) => {
        if (result.isConfirmed) {
            resetAd();
        } else {
            // Reanudar temporizador
            adTimer = setInterval(() => {
                timeLeft--;
                
                if (timerDisplay) {
                    timerDisplay.textContent = formatTime(timeLeft);
                }
                
                if (progressBar) {
                    const percentage = ((AD_DURATION - timeLeft) / AD_DURATION) * 100;
                    progressBar.style.width = `${percentage}%`;
                }
                
                if (timeLeft <= 0) {
                    clearInterval(adTimer);
                    adTimer = null;
                    showRewardButton();
                }
            }, 1000);
        }
    });
}

// Mostrar Botón de Reclamar
function showRewardButton() {
    if (!skipAdBtn || !claimRewardBtn) return;
    
    skipAdBtn.style.display = 'none';
    claimRewardBtn.style.display = 'inline-flex';
    claimRewardBtn.disabled = false;
}

// Reclamar Recompensa
async function claimReward() {
    try {
        const user = currentUser();
        if (!user) return;
        
        claimRewardBtn.disabled = true;
        claimRewardBtn.innerHTML = '<span>⏳ Procesando...</span>';
        
        // Registrar anuncio en BD2
        const { error: adError } = await supabase2
            .from('ads_history')
            .insert({
                user_id: user.id,
                ad_provider: 'internal',
                ad_id: `ad_${Date.now()}`,
                ad_type: 'rewarded',
                ad_duration: AD_DURATION,
                reward_tcoins: REWARD_TCOINS,
                watch_time: AD_DURATION,
                completion_rate: 1.0,
                device_type: getDeviceType(),
                browser: getBrowser(),
                os: getOS(),
                metadata: {
                    campaign: 'daily_reward',
                    placement: 'ads_page'
                }
            });
            
        if (adError) throw adError;
        
        // Añadir TCoins al usuario en BD1
        const { error: tcoinsError } = await supabase1
            .rpc('add_tcoins', {
                user_uuid: user.id,
                amount: REWARD_TCOINS,
                source: 'ad',
                description: 'Recompensa por ver anuncio'
            });
            
        if (tcoinsError) throw tcoinsError;
        
        // Registrar evento en BD2
        const { error: eventError } = await supabase2
            .rpc('log_user_event', {
                p_user_id: user.id,
                p_event_type: 'ad_watched',
                p_event_category: 'reward',
                p_event_action: 'complete',
                p_event_label: 'ad_reward',
                p_event_data: {
                    tcoins: REWARD_TCOINS,
                    duration: AD_DURATION
                }
            });
            
        if (eventError) console.error('Error logging event:', eventError);
        
        // Mostrar éxito
        showSuccess(`¡+${REWARD_TCOINS} TCoins recibidos!`);
        
        // Actualizar estadísticas
        adsToday++;
        lastAdTime = new Date();
        canWatchAds = adsToday < MAX_ADS_PER_DAY;
        
        // Resetear anuncio
        resetAd();
        
        // Actualizar UI
        updateStatsDisplay();
        checkCooldown();
        
    } catch (error) {
        console.error('Error claiming reward:', error);
        showError('Error al procesar recompensa');
        claimRewardBtn.disabled = false;
        claimRewardBtn.innerHTML = '<span>🎁 Reclamar Recompensa</span>';
    }
}

// Resetear Anuncio
function resetAd() {
    isAdPlaying = false;
    timeLeft = AD_DURATION;
    
    // Limpiar temporizador
    if (adTimer) {
        clearInterval(adTimer);
        adTimer = null;
    }
    
    // Limpiar simulador de anuncio
    if (adsContainer) {
        adsContainer.innerHTML = `
            <div class="ad-ready">
                <div class="ad-ready-icon">📺</div>
                <h3>Anuncio Listo</h3>
                <p>Haz clic en "Ver Anuncio" para comenzar</p>
                <p class="ad-ready-info">Gana ${REWARD_TCOINS} TCoins por anuncio</p>
            </div>
        `;
    }
    
    // Actualizar UI
    updateUI();
}

// Helper: Obtener tipo de dispositivo
function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

// Helper: Obtener navegador
function getBrowser() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
}

// Helper: Obtener sistema operativo
function getOS() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
}

// Añadir estilos CSS adicionales
const additionalStyles = `
    .ad-ready {
        text-align: center;
        padding: 3rem 2rem;
        background: var(--bg-hover);
        border-radius: var(--card-radius);
        border: 2px dashed var(--border-color);
    }
    
    .ad-ready-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.7;
    }
    
    .ad-ready h3 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .ad-ready p {
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }
    
    .ad-ready-info {
        color: var(--supernova) !important;
        font-weight: 600;
        margin-top: 1rem !important;
    }
    
    .ads-controls {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
        flex-wrap: wrap;
    }
    
    .ads-controls .btn {
        min-width: 200px;
    }
    
    .timer-container {
        text-align: center;
        margin: 2rem 0;
    }
    
    .progress-container {
        max-width: 500px;
        margin: 1rem auto;
    }
    
    @media (max-width: 768px) {
        .ads-controls .btn {
            min-width: 100%;
        }
        
        .ad-simulation {
            margin: 0 -20px;
            border-radius: 0;
        }
    }
`;

// Inyectar estilos
const styleTag = document.createElement('style');
styleTag.textContent = additionalStyles;
document.head.appendChild(styleTag);

// Exportar funciones
window.startAd = startAd;
window.skipAd = skipAd;
window.claimReward = claimReward;