// Variables globales
let userProfile = null;
let userOrders = [];
let userTransactions = [];

// Inicializar perfil
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthAndLoadProfile();
    setupProfileTabs();
    setupEditProfileForm();
});

// Verificar autenticación y cargar perfil
async function checkAuthAndLoadProfile() {
    const profileContent = document.getElementById('profileContent');
    const notLoggedIn = document.getElementById('notLoggedIn');
    
    if (!window.currentUser) {
        // Mostrar mensaje de no autenticado
        if (profileContent) profileContent.style.display = 'none';
        if (notLoggedIn) notLoggedIn.style.display = 'block';
        return;
    }
    
    // Ocultar mensaje de no autenticado
    if (notLoggedIn) notLoggedIn.style.display = 'none';
    
    try {
        // Cargar datos del perfil
        await loadUserProfile();
        await loadUserOrders();
        await loadUserTransactions();
        
        // Actualizar UI
        updateProfileUI();
        
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        showError('Error al cargar los datos del perfil');
    }
}

// Cargar perfil del usuario
async function loadUserProfile() {
    if (!window.supabase || !window.currentUser) return;
    
    try {
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', window.currentUser.id)
            .single();
        
        if (error) throw error;
        
        userProfile = data;
        
        // Cargar datos extendidos de DB2 si está disponible
        try {
            if (window.supabase2) {
                const { data: extendedData } = await window.supabase2
                    .from('user_profiles')
                    .select('*')
                    .eq('id', window.currentUser.id)
                    .single();
                
                if (extendedData) {
                    userProfile.extended = extendedData;
                }
            }
        } catch (db2Error) {
            console.warn('Error al cargar datos extendidos:', db2Error);
        }
        
    } catch (error) {
        console.error('Error en loadUserProfile:', error);
        throw error;
    }
}

// Cargar órdenes del usuario
async function loadUserOrders() {
    if (!window.supabase || !window.currentUser) return;
    
    try {
        const { data, error } = await window.supabase
            .from('orders')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        userOrders = data || [];
        
    } catch (error) {
        console.error('Error en loadUserOrders:', error);
        userOrders = [];
    }
}

// Cargar transacciones del usuario
async function loadUserTransactions() {
    if (!window.supabase || !window.currentUser) return;
    
    try {
        const { data, error } = await window.supabase
            .from('tcoins_transactions')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        userTransactions = data || [];
        
    } catch (error) {
        console.error('Error en loadUserTransactions:', error);
        userTransactions = [];
    }
}

// Actualizar la interfaz del perfil
function updateProfileUI() {
    if (!userProfile) return;
    
    // Actualizar información básica
    document.getElementById('profileName').textContent = userProfile.nick || 'Sin nombre';
    document.getElementById('profileEmail').textContent = window.currentUser.email;
    document.getElementById('tcoinsBalance').innerHTML = `<i class="fas fa-coins"></i> ${userProfile.tcoins || 0}`;
    
    // Actualizar avatar
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        const skinUrl = userProfile.skin_url || 'https://mc-heads.net/head/Steve';
        profileAvatar.innerHTML = `<img src="${skinUrl}" alt="${userProfile.nick}" onerror="this.src='https://mc-heads.net/head/Steve'">`;
    }
    
    // Actualizar estadísticas
    document.getElementById('totalOrders').textContent = userOrders.length;
    
    // Contar anuncios vistos si hay datos en DB2
    let adsViewed = 0;
    try {
        if (userProfile.extended) {
            // Intentar obtener de ads_history
            adsViewed = userProfile.extended.ads_viewed || 0;
        }
    } catch (e) {
        console.warn('Error al obtener datos de anuncios:', e);
    }
    document.getElementById('totalAds').textContent = adsViewed;
    
    // Actualizar formulario de edición
    const editNick = document.getElementById('editNick');
    const editSkinUrl = document.getElementById('editSkinUrl');
    if (editNick) editNick.value = userProfile.nick || '';
    if (editSkinUrl) editSkinUrl.value = userProfile.skin_url || '';
    
    // Actualizar vista previa de skin
    updateSkinPreview(userProfile.skin_url);
    
    // Actualizar tablas
    updateOrdersTable();
    updateActivityHistory();
}

// Actualizar tabla de órdenes
function updateOrdersTable() {
    const ordersTable = document.getElementById('ordersTable');
    if (!ordersTable) return;
    
    if (userOrders.length === 0) {
        ordersTable.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #b0b0c0;">
                    <i class="fas fa-shopping-cart"></i><br>
                    No tienes compras todavía
                </td>
            </tr>
        `;
        return;
    }
    
    ordersTable.innerHTML = userOrders.map(order => {
        const date = window.formatDate ? window.formatDate(order.created_at) : new Date(order.created_at).toLocaleDateString();
        const price = order.method === 'usd' 
            ? `$${order.price_usd} USD`
            : `<i class="fas fa-coins"></i> ${order.price_tcoins} TCoins`;
        
        const statusClass = order.status === 'completado' ? 'status-completado' : 'status-pendiente';
        const statusText = order.status === 'completado' ? 'Completado' : 'Pendiente';
        
        return `
            <tr>
                <td>${order.product_name}</td>
                <td>${order.method === 'usd' ? 'USD' : 'TCoins'}</td>
                <td>${price}</td>
                <td>${date}</td>
                <td class="${statusClass}">${statusText}</td>
            </tr>
        `;
    }).join('');
}

// Actualizar historial de actividad
function updateActivityHistory() {
    const activityHistory = document.getElementById('activityHistory');
    if (!activityHistory) return;
    
    // Combinar transacciones y órdenes para historial
    const allActivities = [
        ...userTransactions.map(t => ({
            type: 'transaction',
            data: t,
            date: t.created_at
        })),
        ...userOrders.map(o => ({
            type: 'order',
            data: o,
            date: o.created_at
        }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))
     .slice(0, 10); // Últimas 10 actividades
    
    if (allActivities.length === 0) {
        activityHistory.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #b0b0c0;">
                <i class="fas fa-history"></i><br>
                No hay actividad reciente
            </div>
        `;
        return;
    }
    
    activityHistory.innerHTML = allActivities.map(activity => {
        const date = window.formatDate ? window.formatDate(activity.date) : new Date(activity.date).toLocaleDateString();
        
        let icon = '';
        let text = '';
        let color = '#fec600';
        
        if (activity.type === 'transaction') {
            const t = activity.data;
            icon = t.amount > 0 ? 'fa-plus-circle' : 'fa-minus-circle';
            color = t.amount > 0 ? '#00c853' : '#f44336';
            text = `${t.description}: ${t.amount > 0 ? '+' : ''}${t.amount} TCoins`;
        } else if (activity.type === 'order') {
            const o = activity.data;
            icon = 'fa-shopping-cart';
            text = `Compra: ${o.product_name} (${o.method})`;
        }
        
        return `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid rgba(254,198,0,0.1);">
                <div style="color: ${color};">
                    <i class="fas ${icon}"></i>
                </div>
                <div style="flex: 1;">
                    <div>${text}</div>
                    <div style="font-size: 0.75rem; color: #b0b0c0;">${date}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Configurar pestañas del perfil
function setupProfileTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Remover clase active de todas las pestañas y contenidos
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active a la pestaña clickeada y su contenido
            tab.classList.add('active');
            document.getElementById(`${tabId}Tab`)?.classList.add('active');
        });
    });
}

// Configurar formulario de edición de perfil
function setupEditProfileForm() {
    const editForm = document.getElementById('editProfileForm');
    if (!editForm) return;
    
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nick = document.getElementById('editNick').value.trim();
        const skinUrl = document.getElementById('editSkinUrl').value.trim();
        
        if (!nick) {
            showError('El nombre de usuario es obligatorio');
            return;
        }
        
        if (skinUrl && !isValidUrl(skinUrl)) {
            showError('La URL de la skin no es válida');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;
        
        try {
            if (!window.supabase) {
                throw new Error('Error de conexión');
            }
            
            // Actualizar perfil en DB1
            const { error } = await window.supabase
                .from('profiles')
                .update({
                    nick: nick,
                    skin_url: skinUrl || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', window.currentUser.id);
            
            if (error) throw error;
            
            // Actualizar en DB2 si está disponible
            try {
                if (window.supabase2) {
                    await window.supabase2
                        .from('user_profiles')
                        .update({
                            nick: nick,
                            skin_url: skinUrl || null,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', window.currentUser.id);
                }
            } catch (db2Error) {
                console.warn('Error al actualizar en DB2:', db2Error);
            }
            
            // Actualizar datos locales
            userProfile.nick = nick;
            userProfile.skin_url = skinUrl;
            
            // Actualizar UI
            updateProfileUI();
            
            showSuccess('Perfil actualizado correctamente');
            
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            showError('Error al actualizar el perfil: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Configurar botones de skins predeterminadas
    document.querySelectorAll('.default-skin-btn').forEach(button => {
        button.addEventListener('click', () => {
            const skinUrl = button.dataset.skinUrl;
            document.getElementById('editSkinUrl').value = skinUrl;
            updateSkinPreview(skinUrl);
        });
    });
    
    // Actualizar vista previa al cambiar la URL
    const skinUrlInput = document.getElementById('editSkinUrl');
    if (skinUrlInput) {
        skinUrlInput.addEventListener('input', () => {
            updateSkinPreview(skinUrlInput.value);
        });
    }
}

// Actualizar vista previa de skin
function updateSkinPreview(skinUrl) {
    const previewBox = document.getElementById('skinPreviewBox');
    if (!previewBox) return;
    
    if (!skinUrl) {
        previewBox.innerHTML = `
            <div class="skin-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #b0b0c0;">
                <i class="fas fa-user-circle"></i>
            </div>
        `;
        return;
    }
    
    // Crear imagen para la vista previa
    const img = document.createElement('img');
    img.src = skinUrl;
    img.alt = 'Vista previa de skin';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    // Manejar error de carga
    img.onerror = () => {
        previewBox.innerHTML = `
            <div class="skin-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #f44336;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
        `;
    };
    
    // Limpiar y agregar nueva imagen
    previewBox.innerHTML = '';
    previewBox.appendChild(img);
}

// Validar URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Función para cambiar contraseña
async function changePassword(currentPassword, newPassword) {
    if (!window.supabase || !window.currentUser) return false;
    
    try {
        // Primero verificar la contraseña actual
        const { error: signInError } = await window.supabase.auth.signInWithPassword({
            email: window.currentUser.email,
            password: currentPassword
        });
        
        if (signInError) {
            showError('La contraseña actual es incorrecta');
            return false;
        }
        
        // Actualizar la contraseña
        const { error: updateError } = await window.supabase.auth.updateUser({
            password: newPassword
        });
        
        if (updateError) throw updateError;
        
        showSuccess('Contraseña cambiada correctamente');
        return true;
        
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        showError('Error al cambiar la contraseña: ' + error.message);
        return false;
    }
}

// Exportar funciones para uso en otros módulos
window.updateSkinPreview = updateSkinPreview;
window.changePassword = changePassword;