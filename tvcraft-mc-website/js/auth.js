// js/auth.js - SISTEMA HÍBRIDO COMPLETO

console.log('🔐 Auth.js - Sistema híbrido multi-dispositivo');

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando sistema de autenticación...');
    
    // Configurar formularios
    setupAuthForms();
    
    // Verificar si ya hay sesión
    checkAndRedirect();
});

// Configurar formularios
function setupAuthForms() {
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('✅ Configurando formulario de login');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleUniversalLogin(e);
        });
    }
    
    // Register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        console.log('✅ Configurando formulario de registro');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleUniversalRegister(e);
        });
    }
}

// ========== LOGIN UNIVERSAL ==========
async function handleUniversalLogin(e) {
    console.log('🔐 Iniciando sesión universal...');
    
    const form = e.target;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Completa todos los campos', 'error');
        return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    submitBtn.disabled = true;
    
    try {
        console.log('📧 Verificando credenciales...');
        
        // 1. INTENTAR LOGIN CON SUPABASE AUTH (para multi-dispositivo)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (authError) {
            console.warn('⚠️ Supabase Auth falló:', authError.message);
            
            // 2. Si falla Supabase Auth, intentar con nuestra tabla (backup)
            console.log('🔄 Intentando login con tabla local...');
            const localLogin = await tryLocalLogin(email, password);
            
            if (!localLogin.success) {
                throw new Error('Credenciales incorrectas');
            }
            
            // Si login local funciona, actualizar Supabase Auth
            console.log('✅ Login local exitoso, sincronizando con Supabase Auth...');
            await syncWithSupabaseAuth(email, password, localLogin.userData);
            
            showLoginSuccess(localLogin.userData);
            
        } else {
            // 3. Login con Supabase Auth exitoso
            console.log('✅ Supabase Auth exitoso!');
            
            // Verificar/crear perfil en nuestra tabla
            await ensureUserProfile(authData.user, password);
            
            showLoginSuccess({
                id: authData.user.id,
                email: authData.user.email,
                username: authData.user.user_metadata?.username || email.split('@')[0]
            });
        }
        
    } catch (error) {
        console.error('❌ Error en login:', error.message);
        
        let message = 'Error al iniciar sesión';
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Credenciales incorrectas')) {
            message = 'Email o contraseña incorrectos';
        }
        
        showMessage(message, 'error');
        
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ========== REGISTRO UNIVERSAL ==========
async function handleUniversalRegister(e) {
    console.log('👤 Registro universal...');
    
    const form = e.target;
    const email = document.getElementById('email').value.trim();
    const nick = document.getElementById('nick').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const skinUrl = document.getElementById('skinUrl')?.value.trim() || 'https://via.placeholder.com/150';
    
    // Validaciones
    if (!email || !nick || !password || !confirmPassword) {
        showMessage('Completa todos los campos', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
    submitBtn.disabled = true;
    
    try {
        console.log('🔄 Creando cuenta universal...');
        
        // 1. Verificar si el usuario ya existe
        const userExists = await checkUserExists(email);
        if (userExists) {
            throw new Error('Este email ya está registrado');
        }
        
        // 2. Crear usuario en SUPABASE AUTH (para multi-dispositivo)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: nick,
                    skin_url: skinUrl
                }
            }
        });
        
        if (authError) {
            console.warn('⚠️ Error en Supabase Auth:', authError.message);
            
            // Si es error de usuario ya existe, intentar solo guardar en nuestra tabla
            if (authError.message.includes('User already registered')) {
                console.log('ℹ️ Usuario ya existe en Auth, guardando solo en tabla...');
            } else {
                throw authError;
            }
        }
        
        const userId = authData?.user?.id || generateUserId();
        console.log('✅ ID de usuario:', userId);
        
        // 3. Guardar en NUESTRA TABLA con contraseña (protegida por RLS)
        await saveUserToLocalTable(userId, email, nick, password, skinUrl);
        
        // 4. Guardar en segunda base de datos
        await saveToSecondDatabase(userId, email, nick);
        
        // 5. Intentar login automático
        setTimeout(async () => {
            try {
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (loginError) {
                    console.log('ℹ️ Login automático no disponible');
                    showRegisterSuccess(false, email);
                } else {
                    console.log('✅ Login automático exitoso');
                    showRegisterSuccess(true, email);
                }
            } catch (loginError) {
                console.warn('⚠️ Error en login automático:', loginError);
                showRegisterSuccess(false, email);
            }
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error en registro:', error.message);
        
        let message = 'Error al crear la cuenta';
        if (error.message.includes('ya está registrado')) {
            message = 'Este email ya está registrado';
        }
        
        showMessage(message, 'error');
        
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ========== FUNCIONES AUXILIARES ==========

// Intentar login con nuestra tabla (backup)
async function tryLocalLogin(email, password) {
    try {
        // Buscar usuario por email
        const { data: users, error } = await supabase
            .from('cuentas')
            .select('*')
            .eq('email', email)
            .limit(1);
        
        if (error || !users || users.length === 0) {
            return { success: false };
        }
        
        const user = users[0];
        
        // Verificar contraseña (simplificado - en producción usaría bcrypt)
        // NOTA: Esto es solo para demo. En producción necesitas comparar hashes
        if (user.password_hash && user.password_hash === password) {
            return {
                success: true,
                userData: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    tcoins: user.tcoins || 0
                }
            };
        }
        
        return { success: false };
        
    } catch (error) {
        console.error('❌ Error en login local:', error);
        return { success: false };
    }
}

// Sincronizar con Supabase Auth después de login local
async function syncWithSupabaseAuth(email, password, userData) {
    try {
        // Intentar registrar en Supabase Auth si no existe
        const { error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: userData.username,
                    user_id: userData.id
                }
            }
        });
        
        if (signUpError && !signUpError.message.includes('already registered')) {
            console.warn('⚠️ Error sincronizando con Auth:', signUpError.message);
        }
        
        // Actualizar perfil en nuestra tabla con el ID de Auth si es diferente
        if (userData.id && userData.id.startsWith('local_')) {
            const { data: authUser } = await supabase.auth.getUser();
            if (authUser?.user?.id) {
                await updateUserId(userData.id, authUser.user.id);
            }
        }
        
    } catch (error) {
        console.warn('⚠️ Error en sincronización:', error.message);
    }
}

// Verificar si usuario existe
async function checkUserExists(email) {
    try {
        // Verificar en Supabase Auth
        const { data: authUser } = await supabase.auth.getUser();
        
        // Verificar en nuestra tabla
        const { data: localUser, error } = await supabase
            .from('cuentas')
            .select('id')
            .eq('email', email)
            .limit(1);
        
        return !error && localUser && localUser.length > 0;
        
    } catch (error) {
        console.error('❌ Error verificando usuario:', error);
        return false;
    }
}

// Guardar usuario en nuestra tabla
async function saveUserToLocalTable(userId, email, username, password, skinUrl) {
    try {
        const userData = {
            id: userId,
            email: email,
            username: username,
            password_hash: password, // RLS protege esto
            foto_perfil_url: skinUrl,
            tcoins: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('cuentas')
            .insert(userData);
        
        if (error) {
            console.error('❌ Error guardando en tabla:', error);
            throw error;
        }
        
        console.log('✅ Usuario guardado en tabla local');
        return true;
        
    } catch (error) {
        console.error('❌ Error en saveUserToLocalTable:', error);
        throw error;
    }
}

// Guardar en segunda base de datos
async function saveToSecondDatabase(userId, email, username) {
    try {
        if (!window.supabase2) return false;
        
        await window.supabase2
            .from('cuenta2')
            .insert({
                cuenta_id: userId,
                email: email,
                username: username,
                created_at: new Date().toISOString()
            });
        
        console.log('✅ Datos guardados en segunda base');
        return true;
        
    } catch (error) {
        console.warn('⚠️ Error en segunda base:', error.message);
        return false;
    }
}

// Asegurar perfil de usuario
async function ensureUserProfile(authUser, password) {
    try {
        const { data: existingProfile, error } = await supabase
            .from('cuentas')
            .select('id')
            .eq('id', authUser.id)
            .single();
        
        if (error || !existingProfile) {
            // Crear perfil si no existe
            await saveUserToLocalTable(
                authUser.id,
                authUser.email,
                authUser.user_metadata?.username || authUser.email.split('@')[0],
                password,
                authUser.user_metadata?.skin_url || 'https://via.placeholder.com/150'
            );
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error asegurando perfil:', error);
        return false;
    }
}

// Generar ID único
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Actualizar ID de usuario
async function updateUserId(oldId, newId) {
    try {
        await supabase
            .from('cuentas')
            .update({ id: newId })
            .eq('id', oldId);
        
        console.log('✅ ID actualizado:', oldId, '→', newId);
        
    } catch (error) {
        console.error('❌ Error actualizando ID:', error);
    }
}

// Mostrar éxito de login
function showLoginSuccess(userData) {
    // Guardar datos en localStorage para acceso rápido
    localStorage.setItem('current_user', JSON.stringify(userData));
    localStorage.setItem('last_login', Date.now().toString());
    
    showMessage(
        `¡Bienvenido ${userData.username}!<br>` +
        'Sesión iniciada en todos tus dispositivos.',
        'success',
        () => {
            window.location.href = 'index.html';
        }
    );
}

// Mostrar éxito de registro
function showRegisterSuccess(autoLogin, email) {
    if (autoLogin) {
        showMessage(
            '🎉 ¡Cuenta creada exitosamente!<br>' +
            '✅ Sesión iniciada automáticamente<br>' +
            '💰 100 Tcoins de bienvenida',
            'success',
            () => {
                window.location.href = 'index.html';
            }
        );
    } else {
        showMessage(
            '🎉 ¡Cuenta creada exitosamente!<br>' +
            '✅ Puedes iniciar sesión en cualquier dispositivo<br>' +
            '💰 100 Tcoins de bienvenida',
            'success',
            () => {
                window.location.href = 'login.html';
            }
        );
    }
}

// Verificar y redirigir si ya está autenticado
async function checkAndRedirect() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && (window.location.pathname.includes('login.html') || 
                     window.location.pathname.includes('register.html'))) {
            console.log('✅ Usuario ya autenticado, redirigiendo...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
        
    } catch (error) {
        console.log('🔐 No hay sesión activa o error:', error.message);
    }
}

// Mostrar mensajes
function showMessage(message, type = 'info', callback = null) {
    console.log(`📢 ${type.toUpperCase()}: ${message.replace(/<[^>]*>/g, '')}`);
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: type,
            title: type === 'success' ? '¡Éxito!' : 
                   type === 'error' ? 'Error' : 'Información',
            html: message,
            background: '#0b0a15',
            color: '#fff',
            confirmButtonColor: '#fec600'
        }).then((result) => {
            if (result.isConfirmed && callback) callback();
        });
    } else {
        alert(message);
        if (callback) setTimeout(callback, 100);
    }
}

// Cerrar sesión (funciona en todos los dispositivos)
async function logoutUniversal() {
    try {
        // Cerrar sesión de Supabase Auth
        await supabase.auth.signOut();
        
        // Limpiar localStorage
        localStorage.removeItem('current_user');
        localStorage.removeItem('last_login');
        
        showMessage('Sesión cerrada en todos los dispositivos', 'success', () => {
            window.location.href = 'index.html';
        });
        
    } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
        showMessage('Error al cerrar sesión', 'error');
    }
}

// Exportar funciones globales
window.handleUniversalLogin = handleUniversalLogin;
window.handleUniversalRegister = handleUniversalRegister;
window.logoutUniversal = logoutUniversal;
window.showMessage = showMessage;