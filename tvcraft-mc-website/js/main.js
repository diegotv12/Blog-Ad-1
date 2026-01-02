// js/main.js - VERSIÓN CORREGIDA Y COMPLETA

let currentUser = null;
let supabase = null;
let supabase2 = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando aplicación...');
    
    try {
        // 1. Cargar Supabase
        await loadSupabase();
        
        // 2. Crear fondo de estrellas
        createStars();
        
        // 3. Verificar autenticación UNIVERSAL
        await checkUniversalAuth();
        
        // 4. Actualizar UI de navegación
        updateUniversalNav();
        
        // 5. Cargar datos de la página
        loadPageData();
        
        // 6. Setup de eventos
        setupEventListeners();
        
        console.log('✅ Aplicación iniciada correctamente');
        
    } catch (error) {
        console.error('❌ Error al iniciar aplicación:', error);
        showError('Error al cargar la aplicación');
    }
});

// ========== CARGAR SUPABASE ==========
async function loadSupabase() {
    return new Promise((resolve, reject) => {
        // Si ya está cargado, usar el existente
        if (window.supabase && window.supabase2) {
            supabase = window.supabase;
            supabase2 = window.supabase2;
            console.log('✅ Supabase ya cargado');
            resolve();
            return;
        }
        
        console.log('🔄 Cargando Supabase...');
        
        // Cargar desde CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        
        script.onload = function() {
            try {
                // Configurar cliente PRINCIPAL
                supabase = window.supabase = supabase.createClient(
                    'https://auokdrhbpyyjsszadvsc.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2tkcmhicHl5anNzemFkdnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzUyMzYsImV4cCI6MjA4MDkxMTIzNn0.kJxv7R7_xhHC8PtyiqGVeAfRUqPZcFVyu2Q00payaeU'
                );
                
                // Configurar cliente SECUNDARIO
                supabase2 = window.supabase2 = supabase.createClient(
                    'https://pkoupaqiylzmkxczoaot.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrb3VwYXFpeWx6bWt4Y3pvYW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzU5MDUsImV4cCI6MjA4MjkxMTkwNX0.4OU_b2D0clFYb9CXnbO0P7YQQ5xyAEwC41rie4INNNY'
                );
                
                console.log('✅ Supabase configurado correctamente');
                resolve();
                
            } catch (error) {
                console.error('❌ Error configurando Supabase:', error);
                reject(error);
            }
        };
        
        script.onerror = function() {
            console.error('❌ Error cargando Supabase SDK');
            reject(new Error('No se pudo cargar Supabase'));
        };
        
        document.head.appendChild(script);
    });
}

// ========== VERIFICAR AUTENTICACIÓN UNIVERSAL ==========
async function checkUniversalAuth() {
    try {
        console.log('🔐 Verificando autenticación...');
        
        // 1. Verificar Supabase Auth (para multi-dispositivo)
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
            console.warn('⚠️ Error en Supabase Auth:', authError.message);
        }
        
        if (user) {
            // Usuario autenticado via Supabase Auth
            currentUser = {
                id: user.id,
                email: user.email,
                username: user.user_metadata?.username || user.email.split('@')[0],
                source: 'supabase_auth'
            };
            
            console.log('✅ Autenticado via Supabase Auth:', currentUser.email);
            
            // Verificar/crear perfil en tabla cuentas
            await ensureUserProfile(user);
            
        } else {
            // 2. Verificar localStorage (sesión local)
            const localUser = localStorage.getItem('current_user');
            if (localUser) {
                try {
                    const userData = JSON.parse(localUser);
                    
                    // Verificar que no haya expirado
                    if (userData.expires > Date.now()) {
                        currentUser = {
                            id: userData.id,
                            email: userData.email,
                            username: userData.username,
                            tcoins: userData.tcoins || 0,
                            source: 'local_storage'
                        };
                        
                        console.log('✅ Autenticado via localStorage:', currentUser.email);
                    } else {
                        // Sesión expirada
                        console.log('⚠️ Sesión local expirada');
                        localStorage.removeItem('current_user');
                    }
                } catch (parseError) {
                    console.error('❌ Error parseando usuario local:', parseError);
                    localStorage.removeItem('current_user');
                }
            }
        }
        
        // 3. Si está en login/register y ya está autenticado, redirigir
        if (currentUser && (window.location.pathname.includes('login.html') || 
                           window.location.pathname.includes('register.html'))) {
            console.log('🔄 Redirigiendo a index.html...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
        
        return currentUser;
        
    } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        return null;
    }
}

// ========== ACTUALIZAR NAVEGACIÓN UNIVERSAL ==========
function updateUniversalNav() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;
    
    if (currentUser) {
        // Mostrar información del usuario
        const displayName = currentUser.username || 
                          currentUser.email.split('@')[0] || 
                          currentUser.email.substring(0, 15);
        
        navAuth.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span style="color: #fec600; font-size: 0.9rem; font-weight: 500;">
                    <i class="fas fa-user-circle"></i> ${displayName}
                </span>
                <a href="perfil.html" class="btn btn-outline" style="padding: 5px 15px; font-size: 0.9rem;">
                    <i class="fas fa-user"></i> Perfil
                </a>
                <button onclick="logoutUniversal()" class="btn btn-primary" style="padding: 5px 15px; font-size: 0.9rem;">
                    <i class="fas fa-sign-out-alt"></i> Salir
                </button>
            </div>
        `;
    } else {
        // No autenticado
        navAuth.innerHTML = `
            <a href="login.html" class="btn btn-outline" style="margin-right: 10px;">
                <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
            </a>
            <a href="register.html" class="btn btn-primary">
                <i class="fas fa-user-plus"></i> Registrarse
            </a>
        `;
    }
}

// ========== CERRAR SESIÓN UNIVERSAL ==========
async function logoutUniversal() {
    try {
        console.log('🚪 Cerrando sesión...');
        
        // 1. Cerrar sesión de Supabase Auth
        if (supabase) {
            await supabase.auth.signOut();
        }
        
        // 2. Limpiar localStorage
        localStorage.removeItem('current_user');
        
        // 3. Limpiar variables
        currentUser = null;
        
        // 4. Actualizar UI
        updateUniversalNav();
        
        // 5. Mostrar mensaje y redirigir
        showSuccess('Sesión cerrada en todos los dispositivos', () => {
            window.location.href = 'index.html';
        });
        
    } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
        showError('Error al cerrar sesión');
    }
}

// ========== FUNCIONES AUXILIARES ==========

// Crear fondo de estrellas
function createStars() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;
    
    starsContainer.innerHTML = '';
    
    const starCount = 150;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 3 + 1;
        const opacity = Math.random() * 0.7 + 0.3;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 5;
        
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.opacity = opacity;
        star.style.animationDuration = `${duration}s`;
        star.style.animationDelay = `${delay}s`;
        
        starsContainer.appendChild(star);
    }
}

// Asegurar perfil de usuario en tabla cuentas
async function ensureUserProfile(authUser) {
    try {
        // Verificar si ya existe en tabla cuentas
        const { data: existingProfile, error: findError } = await supabase
            .from('cuentas')
            .select('id, username, tcoins')
            .eq('id', authUser.id)
            .single();
        
        if (findError && findError.code === 'PGRST116') {
            // No existe, crear perfil
            console.log('📝 Creando perfil para usuario...');
            
            const userData = {
                id: authUser.id,
                email: authUser.email,
                username: authUser.user_metadata?.username || authUser.email.split('@')[0],
                password_hash: null,
                foto_perfil_url: authUser.user_metadata?.skin_url || 'https://via.placeholder.com/150',
                tcoins: 100,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { error: insertError } = await supabase
                .from('cuentas')
                .insert(userData);
            
            if (insertError) {
                console.warn('⚠️ Error creando perfil:', insertError.message);
            } else {
                console.log('✅ Perfil creado en tabla cuentas');
            }
            
        } else if (findError) {
            console.warn('⚠️ Error verificando perfil:', findError.message);
        } else {
            console.log('✅ Perfil ya existe en tabla cuentas');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en ensureUserProfile:', error);
        return false;
    }
}

// Cargar datos de la página
function loadPageData() {
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/' || path.includes('/index.html')) {
        loadTopBuyers();
    }
}

// Cargar top compradores
async function loadTopBuyers() {
    const topBuyersContainer = document.getElementById('topBuyers');
    if (!topBuyersContainer) return;
    
    try {
        // Obtener usuarios con más TCoins
        const { data: topUsers, error } = await supabase
            .from('cuentas')
            .select('username, tcoins, foto_perfil_url')
            .order('tcoins', { ascending: false })
            .limit(5);
        
        if (error) {
            console.error('❌ Error al cargar top compradores:', error);
            throw error;
        }
        
        // URLs de skins predeterminadas
        const defaultSkins = [
            'https://via.placeholder.com/150',
            'https://mc-heads.net/head/Steve',
            'https://mc-heads.net/head/Alex'
        ];
        
        // Crear HTML para los compradores
        topBuyersContainer.innerHTML = topUsers.map((user, index) => {
            const skinUrl = user.foto_perfil_url || defaultSkins[index] || defaultSkins[0];
            const rank = index + 1;
            
            return `
                <div class="buyer-card">
                    <div class="buyer-rank">#${rank}</div>
                    <div class="buyer-info">
                        <img src="${skinUrl}" 
                             alt="${user.username}" 
                             class="buyer-avatar"
                             onerror="this.src='${defaultSkins[0]}'">
                        <div>
                            <div class="buyer-name">${user.username || 'Usuario'}</div>
                            <div class="buyer-tcoins">
                                <i class="fas fa-coins"></i> ${user.tcoins?.toLocaleString() || 0} TCoins
                            </div>
                        </div>
                    </div>
                    <div class="buyer-stats">
                        <div class="stat">
                            <div class="stat-value">${Math.floor((user.tcoins || 0) / 100)}</div>
                            <div class="stat-label">Compras</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${rank === 1 ? 'VIP' : 'Premium'}</div>
                            <div class="stat-label">Rango</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Error al cargar top compradores:', error);
        
        // Mostrar datos de ejemplo si hay error
        const topBuyers = [
            { name: 'Player1', tcoins: 5000, rank: 1 },
            { name: 'GamerPro', tcoins: 4200, rank: 2 },
            { name: 'MineCrafter', tcoins: 3800, rank: 3 },
            { name: 'BedrockKing', tcoins: 3500, rank: 4 },
            { name: 'SurvivalPro', tcoins: 3200, rank: 5 }
        ];
        
        topBuyersContainer.innerHTML = topBuyers.map(buyer => `
            <div class="buyer-card">
                <div class="buyer-rank">#${buyer.rank}</div>
                <div class="buyer-info">
                    <img src="https://mc-heads.net/head/Steve" 
                         alt="${buyer.name}" 
                         class="buyer-avatar">
                    <div>
                        <div class="buyer-name">${buyer.name}</div>
                        <div class="buyer-tcoins">
                            <i class="fas fa-coins"></i> ${buyer.tcoins.toLocaleString()} TCoins
                        </div>
                    </div>
                </div>
                <div class="buyer-stats">
                    <div class="stat">
                        <div class="stat-value">${Math.floor(buyer.tcoins / 100)}</div>
                        <div class="stat-label">Compras</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${buyer.rank === 1 ? 'VIP' : 'Premium'}</div>
                        <div class="stat-label">Rango</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Setup de eventos
function setupEventListeners() {
    // Toggle del menú móvil
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu?.classList.remove('active');
            if (navToggle) {
                navToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (navMenu?.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            !navToggle?.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Actualizar auth periódicamente
    setInterval(async () => {
        await checkUniversalAuth();
        updateUniversalNav();
    }, 60000); // Cada minuto
}

// ========== FUNCIONES UTILITARIAS ==========

function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            background: '#0b0a15',
            color: '#ffffff',
            confirmButtonColor: '#fec600',
            confirmButtonText: 'Aceptar'
        });
    } else {
        alert('Error: ' + message);
    }
}

function showSuccess(message, callback) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: message,
            background: '#0b0a15',
            color: '#ffffff',
            confirmButtonColor: '#fec600',
            confirmButtonText: 'Aceptar'
        }).then((result) => {
            if (result.isConfirmed && callback) {
                callback();
            }
        });
    } else {
        alert('Éxito: ' + message);
        if (callback) callback();
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCurrentUser() {
    return currentUser;
}

function isAuthenticated() {
    return currentUser !== null;
}

async function getUserProfile() {
    if (!currentUser || !supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('cuentas')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('Error al obtener perfil:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error en getUserProfile:', error);
        return null;
    }
}

// ========== EXPORTAR FUNCIONES GLOBALES ==========
window.showError = showError;
window.showSuccess = showSuccess;
window.formatDate = formatDate;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.getUserProfile = getUserProfile;
window.logoutUniversal = logoutUniversal;
window.currentUser = currentUser;
window.supabase = supabase;
window.supabase2 = supabase2;