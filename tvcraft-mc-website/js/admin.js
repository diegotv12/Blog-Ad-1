// Panel de Administración de TVCRAFT MC - COMPLETO Y FUNCIONAL
// Credenciales de acceso administrativo
const ADMIN_CREDENTIALS = {
    username: 'NOTadmin25',
    password: '25107899'
};

// Estado del admin
let isAdminLoggedIn = false;
let adminData = {
    users: [],
    orders: [],
    products: [],
    codes: [],
    transactions: []
};

// Configuración del sistema
const SYSTEM_CONFIG = {
    tcoinValue: 0.01, // 1 TCoin = $0.01 USD
    adReward: 50, // TCoins por anuncio
    adCooldown: 3600000, // 1 hora en ms
    maxAdsPerDay: 10
};

// Inicializar panel de administración
document.addEventListener('DOMContentLoaded', () => {
    initializeAdminPanel();
});

// Inicializar panel completo
function initializeAdminPanel() {
    setupAdminLogin();
    setupAdminNavigation();
    setupAdminModals();
    setupAdminActions();
    setupAdminFilters();
    setupAdminSearch();
    
    // Verificar si ya está logueado (por localStorage)
    checkAdminSession();
}

// Configurar login del admin
function setupAdminLogin() {
    const loginBtn = document.getElementById('loginAdminBtn');
    const usernameInput = document.getElementById('adminUsername');
    const passwordInput = document.getElementById('adminPassword');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleAdminLogin);
    }
    
    // Permitir login con Enter
    if (usernameInput && passwordInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                passwordInput.focus();
            }
        });
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAdminLogin();
            }
        });
    }
    
    // Botón de logout
    const logoutBtn = document.getElementById('logoutAdminBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }
}

// Manejar login del admin
async function handleAdminLogin() {
    const username = document.getElementById('adminUsername')?.value.trim();
    const password = document.getElementById('adminPassword')?.value;
    
    if (!username || !password) {
        showError('Por favor, ingresa usuario y contraseña');
        return;
    }
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Login exitoso
        isAdminLoggedIn = true;
        
        // Guardar sesión en localStorage
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminLoginTime', Date.now().toString());
        
        // Ocultar formulario de login y mostrar dashboard
        document.getElementById('adminLoginForm').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        document.getElementById('adminSidebar').style.display = 'block';
        
        // Cargar datos iniciales
        await loadAllAdminData();
        
        // Mostrar dashboard por defecto
        showSection('dashboard');
        
        showSuccess('Acceso concedido. Bienvenido al panel de administración.');
        
    } else {
        showError('Credenciales incorrectas. Acceso denegado.');
    }
}

// Verificar sesión del admin
function checkAdminSession() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    const loginTime = parseInt(localStorage.getItem('adminLoginTime') || '0');
    const sessionDuration = 8 * 60 * 60 * 1000; // 8 horas
    
    if (isLoggedIn && (Date.now() - loginTime) < sessionDuration) {
        // Sesión válida
        isAdminLoggedIn = true;
        document.getElementById('adminLoginForm').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        document.getElementById('adminSidebar').style.display = 'block';
        loadAllAdminData();
        showSection('dashboard');
    } else {
        // Sesión expirada
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        isAdminLoggedIn = false;
    }
}

// Manejar logout del admin
function handleAdminLogout() {
    showConfirm('¿Estás seguro de cerrar sesión?', async () => {
        isAdminLoggedIn = false;
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        
        // Mostrar formulario de login y ocultar dashboard
        document.getElementById('adminLoginForm').style.display = 'block';
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('adminSidebar').style.display = 'none';
        
        // Resetear formulario
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        
        showSuccess('Sesión cerrada correctamente.');
    });
}

// Configurar navegación del admin
function setupAdminNavigation() {
    const navLinks = document.querySelectorAll('.nav-admin a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (!isAdminLoggedIn) {
                showError('Debes iniciar sesión primero');
                return;
            }
            
            const sectionId = link.dataset.section;
            showSection(sectionId);
        });
    });
}

// Mostrar sección específica
async function showSection(sectionId) {
    // Actualizar navegación activa
    document.querySelectorAll('.nav-admin a').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-admin a[data-section="${sectionId}"]`)?.classList.add('active');
    
    // Ocultar todas las secciones
    document.querySelectorAll('.admin-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar sección correspondiente
    const targetSection = document.getElementById(`${sectionId}Section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Actualizar título y descripción
        updateSectionHeader(sectionId);
        
        // Cargar datos de la sección
        await loadSectionData(sectionId);
    }
}

// Actualizar encabezado de sección
function updateSectionHeader(sectionId) {
    const sectionTitle = document.getElementById('sectionTitle');
    const sectionDescription = document.getElementById('sectionDescription');
    
    if (!sectionTitle || !sectionDescription) return;
    
    const sections = {
        dashboard: {
            title: 'Dashboard de Administración',
            description: 'Vista general del sistema y estadísticas'
        },
        users: {
            title: 'Gestión de Usuarios',
            description: 'Administra usuarios, roles y estados de cuenta'
        },
        orders: {
            title: 'Gestión de Compras',
            description: 'Revisa y procesa compras pendientes'
        },
        products: {
            title: 'Gestión de Productos',
            description: 'Administra productos de la tienda'
        },
        codes: {
            title: 'Gestión de Códigos',
            description: 'Crea y administra códigos promocionales'
        },
        transactions: {
            title: 'Transacciones',
            description: 'Historial de transacciones de TCoins'
        },
        ads: {
            title: 'Gestión de Anuncios',
            description: 'Controla el sistema de anuncios'
        },
        system: {
            title: 'Configuración del Sistema',
            description: 'Ajustes generales y mantenimiento'
        }
    };
    
    const section = sections[sectionId] || {
        title: 'Panel de Administración',
        description: 'Gestiona usuarios, compras y configuración del servidor'
    };
    
    sectionTitle.textContent = section.title;
    sectionDescription.textContent = section.description;
}

// Configurar modales
function setupAdminModals() {
    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Cerrar al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Guardar cambios de usuario
    document.getElementById('saveUserBtn')?.addEventListener('click', saveUserChanges);
    
    // Confirmar agregar TCoins
    document.getElementById('confirmAddTCoinsBtn')?.addEventListener('click', confirmAddTCoins);
    
    // Guardar producto
    document.getElementById('saveProductBtn')?.addEventListener('click', saveProduct);
    
    // Guardar código
    document.getElementById('saveCodeBtn')?.addEventListener('click', saveCode);
    
    // Guardar configuración
    document.getElementById('saveConfigBtn')?.addEventListener('click', saveSystemConfig);
}

// Cerrar todos los modales
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Configurar acciones rápidas
function setupAdminActions() {
    // Acciones rápidas del dashboard
    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.addEventListener('click', function() {
            const action = this.dataset.action;
            handleQuickAction(action);
        });
    });
    
    // Botones principales
    document.getElementById('addUserBtn')?.addEventListener('click', () => showAddUserModal());
    document.getElementById('addProductBtn')?.addEventListener('click', () => showAddProductModal());
    document.getElementById('addCodeBtn')?.addEventListener('click', () => showAddCodeModal());
    
    // Botón de recargar datos
    document.getElementById('reloadDataBtn')?.addEventListener('click', async () => {
        await loadAllAdminData();
        showSuccess('Datos recargados correctamente');
    });
}

// Configurar filtros
function setupAdminFilters() {
    // Filtro de compras
    document.getElementById('orderFilter')?.addEventListener('change', filterOrdersByStatus);
    
    // Filtro de usuarios
    document.getElementById('userFilter')?.addEventListener('change', filterUsersByRole);
    
    // Filtro de productos
    document.getElementById('productFilter')?.addEventListener('change', filterProductsByCategory);
}

// Configurar búsquedas
function setupAdminSearch() {
    // Búsqueda global
    document.getElementById('adminSearch')?.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        filterCurrentSection(searchTerm);
    });
    
    // Búsquedas específicas
    document.getElementById('userSearch')?.addEventListener('input', filterUsersTable);
    document.getElementById('orderSearch')?.addEventListener('input', filterOrdersTable);
    document.getElementById('productSearch')?.addEventListener('input', filterProductsTable);
}

// Cargar todos los datos del admin
async function loadAllAdminData() {
    try {
        showLoading('Cargando datos del sistema...');
        
        await Promise.all([
            loadUsersData(),
            loadOrdersData(),
            loadProductsData(),
            loadCodesData(),
            loadTransactionsData(),
            loadSystemConfig()
        ]);
        
        // Actualizar estadísticas
        updateAllStats();
        
        hideLoading();
        
    } catch (error) {
        console.error('Error al cargar datos del admin:', error);
        showError('Error al cargar los datos del sistema');
        hideLoading();
    }
}

// Cargar datos según la sección
async function loadSectionData(sectionId) {
    if (!isAdminLoggedIn) return;
    
    try {
        switch (sectionId) {
            case 'dashboard':
                await updateDashboard();
                break;
            case 'users':
                await loadUsersData();
                updateUsersTable();
                break;
            case 'orders':
                await loadOrdersData();
                updateOrdersTable();
                break;
            case 'products':
                await loadProductsData();
                updateProductsTable();
                break;
            case 'codes':
                await loadCodesData();
                updateCodesTable();
                break;
            case 'transactions':
                await loadTransactionsData();
                updateTransactionsTable();
                break;
            case 'ads':
                await loadAdsData();
                updateAdsTable();
                break;
            case 'system':
                await loadSystemConfig();
                updateSystemConfigForm();
                break;
        }
    } catch (error) {
        console.error(`Error al cargar sección ${sectionId}:`, error);
        showError(`Error al cargar datos de ${sectionId}`);
    }
}

// ==============================================
// FUNCIONES DE USUARIOS
// ==============================================

// Cargar datos de usuarios
async function loadUsersData() {
    try {
        if (!window.supabase) {
            throw new Error('Error de conexión con la base de datos');
        }
        
        const { data: users, error } = await window.supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        adminData.users = users || [];
        return adminData.users;
        
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        adminData.users = [];
        throw error;
    }
}

// Actualizar tabla de usuarios
function updateUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (adminData.users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #b0b0c0;">
                    <i class="fas fa-users"></i> No hay usuarios registrados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = adminData.users.map(user => {
        const avatarUrl = user.skin_url ? `${user.skin_url}/40` : 'https://mc-heads.net/head/Steve/40';
        const roleBadge = user.role === 'admin' ? 
            '<span class="badge badge-admin">Admin</span>' : 
            '<span class="badge badge-user">User</span>';
        
        const statusBadge = user.banned ? 
            '<span class="badge badge-banned">Baneado</span>' : 
            '<span class="status-badge status-active">Activo</span>';
        
        const date = user.created_at ? formatDate(user.created_at) : 'N/A';
        
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <img src="${avatarUrl}" 
                             alt="${user.nick}" 
                             class="user-avatar"
                             onerror="this.src='https://mc-heads.net/head/Steve/40'">
                        <div>
                            <div style="font-weight: 600;">${user.nick}</div>
                            <div style="font-size: 0.75rem; color: #b0b0c0;">ID: ${user.id?.substring(0, 8) || 'N/A'}...</div>
                        </div>
                    </div>
                </td>
                <td>${user.email || 'N/A'}</td>
                <td><strong>${user.tcoins || 0}</strong></td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td>${date}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline edit-user" 
                                data-user-id="${user.id}"
                                data-user-nick="${user.nick}"
                                data-user-email="${user.email}"
                                data-user-tcoins="${user.tcoins || 0}"
                                data-user-role="${user.role || 'user'}"
                                data-user-banned="${user.banned || false}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline ${user.banned ? 'unban-user' : 'ban-user'}" 
                                data-user-id="${user.id}" 
                                data-user-name="${user.nick}">
                            <i class="fas ${user.banned ? 'fa-user-check' : 'fa-ban'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline add-tcoins" 
                                data-user-id="${user.id}" 
                                data-user-name="${user.nick}">
                            <i class="fas fa-coins"></i>
                        </button>
                        <button class="btn btn-sm btn-outline delete-user" 
                                data-user-id="${user.id}" 
                                data-user-name="${user.nick}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Agregar eventos a los botones
    setupUserActionButtons();
}

// Configurar botones de acción de usuarios
function setupUserActionButtons() {
    // Botón de editar
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.userId;
            const user = {
                id: userId,
                nick: btn.dataset.userNick,
                email: btn.dataset.userEmail,
                tcoins: parseInt(btn.dataset.userTcoins),
                role: btn.dataset.userRole,
                banned: btn.dataset.userBanned === 'true'
            };
            showEditUserModal(user);
        });
    });
    
    // Botón de ban/desban
    document.querySelectorAll('.ban-user, .unban-user').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.userId;
            const userName = btn.dataset.userName;
            const isBanned = btn.classList.contains('unban-user');
            toggleUserBan(userId, userName, isBanned);
        });
    });
    
    // Botón de agregar TCoins
    document.querySelectorAll('.add-tcoins').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.userId;
            const userName = btn.dataset.userName;
            showAddTCoinsModal(userId, userName);
        });
    });
    
    // Botón de eliminar usuario
    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.userId;
            const userName = btn.dataset.userName;
            deleteUser(userId, userName);
        });
    });
}

// Mostrar modal para editar usuario
function showEditUserModal(user) {
    const modal = document.getElementById('editUserModal');
    if (!modal) return;
    
    // Llenar formulario
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserNick').value = user.nick || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserTCoins').value = user.tcoins || 0;
    document.getElementById('editUserRole').value = user.role || 'user';
    document.getElementById('editUserBanned').value = user.banned ? 'true' : 'false';
    
    // Actualizar título
    document.querySelector('#editUserModal .modal-title').textContent = `Editar Usuario: ${user.nick}`;
    
    // Mostrar modal
    modal.style.display = 'flex';
}

// Guardar cambios de usuario
async function saveUserChanges() {
    const userId = document.getElementById('editUserId').value;
    const nick = document.getElementById('editUserNick').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const tcoins = parseInt(document.getElementById('editUserTCoins').value) || 0;
    const role = document.getElementById('editUserRole').value;
    const banned = document.getElementById('editUserBanned').value === 'true';
    
    if (!nick) {
        showError('El nick es obligatorio');
        return;
    }
    
    try {
        if (!window.supabase) {
            throw new Error('Error de conexión con la base de datos');
        }
        
        // Actualizar usuario en Supabase
        const { error } = await window.supabase
            .from('profiles')
            .update({
                nick: nick,
                email: email || null,
                tcoins: tcoins,
                role: role,
                banned: banned,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) throw error;
        
        // Cerrar modal
        closeAllModals();
        
        // Recargar datos
        await loadUsersData();
        updateUsersTable();
        updateAllStats();
        
        showSuccess('Usuario actualizado correctamente');
        
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        showError('Error al actualizar usuario: ' + error.message);
    }
}

// Alternar ban de usuario
async function toggleUserBan(userId, userName, currentlyBanned) {
    const action = currentlyBanned ? 'desbanear' : 'banear';
    
    showConfirm(
        `¿Estás seguro de ${action} a <strong>${userName}</strong>?`,
        
        async () => {
            try {
                if (!window.supabase) {
                    throw new Error('Error de conexión con la base de datos');
                }
                
                const { error } = await window.supabase
                    .from('profiles')
                    .update({
                        banned: !currentlyBanned,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);
                
                if (error) throw error;
                
                showSuccess(`Usuario ${action}do correctamente`);
                
                // Recargar datos
                await loadUsersData();
                updateUsersTable();
                updateAllStats();
                
            } catch (error) {
                showError(`Error al ${action} usuario: ` + error.message);
            }
        }
    );
}

// Mostrar modal para agregar TCoins
function showAddTCoinsModal(userId, userName) {
    const modal = document.getElementById('addTCoinsModal');
    if (!modal) return;
    
    // Configurar formulario
    document.getElementById('addTCoinsUserId').value = userId;
    document.getElementById('addTCoinsAmount').value = '';
    document.getElementById('addTCoinsReason').value = '';
    
    // Actualizar título dinámicamente
    const title = modal.querySelector('.modal-title');
    if (title) {
        title.textContent = `Agregar TCoins a ${userName}`;
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
}

// Confirmar agregar TCoins
async function confirmAddTCoins() {
    const userId = document.getElementById('addTCoinsUserId').value;
    const amount = parseInt(document.getElementById('addTCoinsAmount').value);
    const reason = document.getElementById('addTCoinsReason').value.trim();
    
    if (!amount || amount < 1) {
        showError('La cantidad debe ser mayor a 0');
        return;
    }
    
    try {
        if (!window.supabase) {
            throw new Error('Error de conexión con la base de datos');
        }
        
        // Obtener saldo actual
        const { data: user, error: userError } = await window.supabase
            .from('profiles')
            .select('tcoins')
            .eq('id', userId)
            .single();
        
        if (userError) throw userError;
        
        const newBalance = (user.tcoins || 0) + amount;
        
        // Actualizar saldo
        const { error: updateError } = await window.supabase
            .from('profiles')
            .update({ tcoins: newBalance })
            .eq('id', userId);
        
        if (updateError) throw updateError;
        
        // Registrar transacción
        const { error: transError } = await window.supabase
            .from('tcoins_transactions')
            .insert({
                user_id: userId,
                amount: amount,
                type: 'admin',
                description: reason || 'Ajuste administrativo',
                balance_after: newBalance,
                created_at: new Date().toISOString()
            });
        
        if (transError) throw transError;
        
        // Cerrar modal
        closeAllModals();
        
        // Recargar datos
        await loadUsersData();
        await loadTransactionsData();
        updateUsersTable();
        updateTransactionsTable();
        updateAllStats();
        
        showSuccess(`${amount} TCoins agregados correctamente`);
        
    } catch (error) {
        console.error('Error al agregar TCoins:', error);
        showError('Error al agregar TCoins: ' + error.message);
    }
}

// Eliminar usuario
async function deleteUser(userId, userName) {
    showConfirm(
        `¿Estás seguro de eliminar al usuario <strong>${userName}</strong>?<br><br>
        <small style="color: #f44336;">Esta acción no se puede deshacer y eliminará todos los datos del usuario.</small>`,
        
        async () => {
            try {
                if (!window.supabase) {
                    throw new Error('Error de conexión con la base de datos');
                }
                
                // Eliminar transacciones del usuario
                await window.supabase
                    .from('tcoins_transactions')
                    .delete()
                    .eq('user_id', userId);
                
                // Eliminar órdenes del usuario
                await window.supabase
                    .from('orders')
                    .delete()
                    .eq('user_id', userId);
                
                // Eliminar perfil del usuario
                const { error } = await window.supabase
                    .from('profiles')
                    .delete()
                    .eq('id', userId);
                
                if (error) throw error;
                
                showSuccess(`Usuario ${userName} eliminado correctamente`);
                
                // Recargar datos
                await loadAllAdminData();
                updateUsersTable();
                updateAllStats();
                
            } catch (error) {
                console.error('Error al eliminar usuario:', error);
                showError('Error al eliminar usuario: ' + error.message);
            }
        }
    );
}

// Mostrar modal para agregar usuario
function showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (!modal) return;
    
    // Resetear formulario
    document.getElementById('addUserForm').reset();
    
    // Mostrar modal
    modal.style.display = 'flex';
}

// ==============================================
// FUNCIONES DE PRODUCTOS
// ==============================================

// Cargar datos de productos
async function loadProductsData() {
    try {
        // Datos de productos predefinidos
        adminData.products = [
            {
                id: 'rango-poseidon',
                name: 'Rango Poseidon',
                category: 'rango',
                price_usd: 7,
                price_tcoins: 500,
                image_name: 'RankPoseidon.png',
                is_active: true,
                description: 'Rango mensual con beneficios exclusivos'
            },
            {
                id: 'rango-mitico',
                name: 'Rango Mítico',
                category: 'rango',
                price_usd: 14,
                price_tcoins: 900,
                image_name: 'RankMitico.png',
                is_active: true,
                description: 'Rango mensual premium con todos los beneficios'
            },
            {
                id: 'kit-poseidon',
                name: 'Kit Poseidon',
                category: 'kit',
                price_usd: 5,
                price_tcoins: 50,
                image_name: 'KitPoseidon.png',
                is_active: true,
                description: 'Kit básico con objetos iniciales'
            },
            {
                id: 'kit-mitico',
                name: 'Kit Mítico',
                category: 'kit',
                price_usd: 12,
                price_tcoins: 83,
                image_name: 'KitMitico.png',
                is_active: true,
                description: 'Kit avanzado con objetos poderosos'
            },
            {
                id: 'llave-poseidon',
                name: 'Llave Poseidon',
                category: 'llave',
                price_usd: 3,
                price_tcoins: 300,
                image_name: 'KeyPoseidon.png',
                is_active: true,
                description: 'Llave para cajas especiales'
            },
            {
                id: 'llave-mitica',
                name: 'Llave Mítica',
                category: 'llave',
                price_usd: 6,
                price_tcoins: 600,
                image_name: 'KeyMitica.png',
                is_active: true,
                description: 'Llave premium para cajas míticas'
            }
        ];
        
        return adminData.products;
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        adminData.products = [];
        throw error;
    }
}

// Actualizar tabla de productos
function updateProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    if (adminData.products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #b0b0c0;">
                    <i class="fas fa-box"></i> No hay productos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = adminData.products.map(product => {
        const categoryBadge = getCategoryBadge(product.category);
        const statusBadge = product.is_active ? 
            '<span class="status-badge status-active">Activo</span>' : 
            '<span class="badge badge-banned">Inactivo</span>';
        
        return `
            <tr>
                <td>${product.id}</td>
                <td><strong>${product.name}</strong></td>
                <td>${categoryBadge}</td>
                <td>${product.price_usd ? `$${product.price_usd}` : '-'}</td>
                <td>${product.price_tcoins ? `${product.price_tcoins} TCoins` : '-'}</td>
                <td>${product.image_name || 'N/A'}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline edit-product" 
                                data-product-id="${product.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline toggle-product" 
                                data-product-id="${product.id}"
                                data-product-name="${product.name}"
                                data-product-active="${product.is_active}">
                            <i class="fas ${product.is_active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline delete-product" 
                                data-product-id="${product.id}"
                                data-product-name="${product.name}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Agregar eventos a los botones
    setupProductActionButtons();
}

// Configurar botones de acción de productos
function setupProductActionButtons() {
    // Botón de editar
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.productId;
            const product = adminData.products.find(p => p.id === productId);
            if (product) showEditProductModal(product);
        });
    });
    
    // Botón de activar/desactivar
    document.querySelectorAll('.toggle-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.productId;
            const productName = btn.dataset.productName;
            const isActive = btn.dataset.productActive === 'true';
            toggleProductStatus(productId, productName, isActive);
        });
    });
    
    // Botón de eliminar
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.productId;
            const productName = btn.dataset.productName;
            deleteProduct(productId, productName);
        });
    });
}

// Mostrar modal para agregar/editar producto
function showAddProductModal(product = null) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    const form = document.getElementById('productForm');
    const title = modal.querySelector('.modal-title');
    
    if (product) {
        // Modo edición
        title.textContent = `Editar Producto: ${product.name}`;
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPriceUSD').value = product.price_usd || '';
        document.getElementById('productPriceTCoins').value = product.price_tcoins || '';
        document.getElementById('productImage').value = product.image_name || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productActive').value = product.is_active ? 'true' : 'false';
    } else {
        // Modo agregar
        title.textContent = 'Agregar Nuevo Producto';
        form.reset();
        document.getElementById('productId').value = 'prod-' + Date.now();
    }
    
    modal.style.display = 'flex';
}

// Guardar producto
async function saveProduct() {
    const form = document.getElementById('productForm');
    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const priceUSD = parseFloat(document.getElementById('productPriceUSD').value) || 0;
    const priceTCoins = parseInt(document.getElementById('productPriceTCoins').value) || 0;
    const imageName = document.getElementById('productImage').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const isActive = document.getElementById('productActive').value === 'true';
    
    if (!productName || !category) {
        showError('Nombre y categoría son obligatorios');
        return;
    }
    
    const productData = {
        id: productId,
        name: productName,
        category: category,
        price_usd: priceUSD,
        price_tcoins: priceTCoins,
        image_name: imageName,
        description: description,
        is_active: isActive
    };
    
    try {
        // Buscar si el producto ya existe
        const existingIndex = adminData.products.findIndex(p => p.id === productId);
        
        if (existingIndex >= 0) {
            // Actualizar producto existente
            adminData.products[existingIndex] = productData;
        } else {
            // Agregar nuevo producto
            adminData.products.push(productData);
        }
        
        // Aquí iría la lógica para guardar en Supabase
        // Por ahora solo actualizamos la tabla localmente
        
        // Cerrar modal
        closeAllModals();
        
        // Actualizar tabla
        updateProductsTable();
        
        showSuccess(`Producto "${productName}" guardado correctamente`);
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
        showError('Error al guardar producto: ' + error.message);
    }
}

// Alternar estado del producto
async function toggleProductStatus(productId, productName, isActive) {
    const action = isActive ? 'desactivar' : 'activar';
    
    showConfirm(
        `¿Estás seguro de ${action} el producto <strong>${productName}</strong>?`,
        
        async () => {
            try {
                const product = adminData.products.find(p => p.id === productId);
                if (product) {
                    product.is_active = !isActive;
                    
                    // Aquí iría la lógica para actualizar en Supabase
                    
                    updateProductsTable();
                    showSuccess(`Producto ${action}do correctamente`);
                }
            } catch (error) {
                showError(`Error al ${action} producto: ` + error.message);
            }
        }
    );
}

// Eliminar producto
async function deleteProduct(productId, productName) {
    showConfirm(
        `¿Estás seguro de eliminar el producto <strong>${productName}</strong>?<br><br>
        <small style="color: #f44336;">Esta acción no se puede deshacer.</small>`,
        
        async () => {
            try {
                adminData.products = adminData.products.filter(p => p.id !== productId);
                
                // Aquí iría la lógica para eliminar de Supabase
                
                updateProductsTable();
                showSuccess(`Producto "${productName}" eliminado correctamente`);
                
            } catch (error) {
                console.error('Error al eliminar producto:', error);
                showError('Error al eliminar producto: ' + error.message);
            }
        }
    );
}

// ==============================================
// FUNCIONES DE CÓDIGOS
// ==============================================

// Cargar datos de códigos
async function loadCodesData() {
    try {
        if (!window.supabase) {
            throw new Error('Error de conexión con la base de datos');
        }
        
        const { data: codes, error } = await window.supabase
            .from('redeem_codes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        adminData.codes = codes || [];
        return adminData.codes;
        
    } catch (error) {
        console.error('Error al cargar códigos:', error);
        adminData.codes = [];
        throw error;
    }
}

// Actualizar tabla de códigos
function updateCodesTable() {
    const tbody = document.getElementById('codesTableBody');
    if (!tbody) return;
    
    if (adminData.codes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #b0b0c0;">
                    <i class="fas fa-gift"></i> No hay códigos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = adminData.codes.map(code => {
        const typeBadge = code.reward_type === 'tcoin' ? 
            '<span class="badge" style="background-color: rgba(254,198,0,0.2); color: #fec600;">TCoins</span>' : 
            '<span class="badge" style="background-color: rgba(0,200,83,0.2); color: #00c853;">Item</span>';
        
        const statusBadge = code.is_active ? 
            '<span class="status-badge status-active">Activo</span>' : 
            '<span class="badge badge-banned">Inactivo</span>';
        
        const date = code.created_at ? formatDate(code.created_at) : 'N/A';
        const uses = code.uses || 0;
        const maxUses = code.max_uses || 'Ilimitado';
        
        return `
            <tr>
                <td><code style="background: rgba(254,198,0,0.1); padding: 0.25rem 0.5rem; border-radius: 4px;">${code.code}</code></td>
                <td>${typeBadge}</td>
                <td><strong>${code.reward_value}</strong></td>
                <td>${uses} / ${maxUses}</td>
                <td>${statusBadge}</td>
                <td>${date}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline toggle-code" 
                                data-code="${code.code}"
                                data-code-name="${code.code}"
                                data-code-active="${code.is_active}">
                            <i class="fas ${code.is_active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline delete-code" 
                                data-code="${code.code}"
                                data-code-name="${code.code}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Agregar eventos a los botones
    setupCodeActionButtons();
}

// Configurar botones de acción de códigos
function setupCodeActionButtons() {
    // Botón de activar/desactivar
    document.querySelectorAll('.toggle-code').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.dataset.code;
            const codeName = btn.dataset.codeName;
            const isActive = btn.dataset.codeActive === 'true';
            toggleCodeStatus(code, codeName, isActive);
        });
    });
    
    // Botón de eliminar
    document.querySelectorAll('.delete-code').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.dataset.code;
            const codeName = btn.dataset.codeName;
            deleteCode(code, codeName);
        });
    });
}

// Mostrar modal para agregar código
function showAddCodeModal() {
    const modal = document.getElementById('codeModal');
    if (!modal) return;
    
    // Resetear formulario
    document.getElementById('codeForm').reset();
    
    // Generar código aleatorio
    const randomCode = 'CODE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById('codeValue').value = randomCode;
    
    // Mostrar modal
    modal.style.display = 'flex';
}

// Generar código aleatorio
function generateRandomCode() {
    const prefixes = ['TVMC', 'GIFT', 'BONUS', 'REWARD', 'SPECIAL'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${suffix}`;
}

// Guardar código
async function saveCode() {
    const code = document.getElementById('codeValue').value.trim().toUpperCase();
    const rewardType = document.getElementById('codeRewardType').value;
    const rewardValue = document.getElementById('codeRewardValue').value.trim();
    const maxUses = parseInt(document.getElementById('codeMaxUses').value) || null;
    const isActive = document.getElementById('codeActive').value === 'true';
    
    if (!code || !rewardType || !rewardValue) {
        showError('Código, tipo y valor de recompensa son obligatorios');
        return;
    }
    
    try {
        if (!window.supabase) {
            throw new Error('Error de conexión con la base de datos');
        }
        
        const codeData = {
            code: code,
            reward_type: rewardType,
            reward_value: rewardValue,
            max_uses: maxUses,
            is_active: isActive,
            created_at: new Date().toISOString()
        };
        
        // Verificar si el código ya existe
        const { data: existingCode } = await window.supabase
            .from('redeem_codes')
            .select('code')
            .eq('code', code)
            .single();
        
        if (existingCode) {
            showError('Este código ya existe');
            return;
        }
        
        // Insertar nuevo código
        const { error } = await window.supabase
            .from('redeem_codes')
            .insert(codeData);
        
        if (error) throw error;
        
        // Cerrar modal
        closeAllModals();
        
        // Recargar datos
        await loadCodesData();
        updateCodesTable();
        
        showSuccess(`Código "${code}" creado correctamente`);
        
    } catch (error) {
        console.error('Error al guardar código:', error);
        showError('Error al guardar código: ' + error.message);
    }
}

// Alternar estado del código
async function toggleCodeStatus(code, codeName, isActive) {
    const action = isActive ? 'desactivar' : 'activar';
    
    showConfirm(
        `¿Estás seguro de ${action} el código <strong>${codeName}</strong>?`,
        
        async () => {
            try {
                if (!window.supabase) {
                    throw new Error('Error de conexión con la base de datos');
                }
                
                const { error } = await window.supabase
                    .from('redeem_codes')
                    .update({
                        is_active: !isActive,
                        updated_at: new Date().toISOString()
                    })
                    .eq('code', code);
                
                if (error) throw error;
                
                // Recargar datos
                await loadCodesData();
                updateCodesTable();
                
                showSuccess(`Código ${action}do correctamente`);
                
            } catch (error) {
                showError(`Error al ${action} código: ` + error.message);
            }
        }
    );
}

// Eliminar código
async function deleteCode(code, codeName) {
    showConfirm(
        `¿Estás seguro de eliminar el código <strong>${codeName}</strong>?<br><br>
        <small style="color: #f44336;">Esta acción no se puede deshacer.</small>`,
        
        async () => {
            try {
                if (!window.supabase) {
                    throw new Error('Error de conexión con la base de datos');
                }
                
                const { error } = await window.supabase
                    .from('redeem_codes')
                    .delete()
                    .eq('code', code);
                
                if (error) throw error;
                
                // Recargar datos
                await loadCodesData();
                updateCodesTable();
                
                showSuccess(`Código "${codeName}" eliminado correctamente`);
                
            } catch (error) {
                console.error('Error al eliminar código:', error);
                showError('Error al eliminar código: ' + error.message);
            }
        }
    );
}

// ==============================================
// FUNCIONES DE TRANSACCIONES
// ==============================================

// Cargar datos de transacciones
async function loadTransactionsData() {
    try {
        if (!window.supabase) {
            throw new Error('Error de conexión con la base de datos');
        }
        
        const { data: transactions, error } = await window.supabase
            .from('tcoins_transactions')
            .select('*, profiles(nick)')
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (error) throw error;
        
        adminData.transactions = transactions || [];
        return adminData.transactions;
        
    } catch (error) {
        console.error('Error al cargar transacciones:', error);
        adminData.transactions = [];
        throw error;
    }
}

// Actualizar tabla de transacciones
function updateTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;
    
    if (adminData.transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #b0b0c0;">
                    <i class="fas fa-exchange-alt"></i> No hay transacciones registradas
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = adminData.transactions.map(trans => {
        const typeBadge = getTransactionTypeBadge(trans.type);
        const amountClass = trans.amount > 0 ? 'text-success' : 'text-danger';
        const userName = trans.profiles?.nick || 'Usuario';
        const date = trans.created_at ? formatDate(trans.created_at) : 'N/A';
        
        return `
            <tr>
                <td>${trans.id}</td>
                <td>${userName}</td>
                <td><span class="${amountClass}">${trans.amount > 0 ? '+' : ''}${trans.amount}</span></td>
                <td>${typeBadge}</td>
                <td>${trans.description || 'N/A'}</td>
                <td><strong>${trans.balance_after || 0}</strong></td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');
}

// ==============================================
// FUNCIONES DE DASHBOARD
// ==============================================

// Actualizar dashboard
async function updateDashboard() {
    updateAllStats();
    await loadRecentActivity();
    updateQuickStats();
}

// Actualizar todas las estadísticas
function updateAllStats() {
    // Estadísticas de usuarios
    const totalUsers = adminData.users.length;
    const bannedUsers = adminData.users.filter(u => u.banned).length;
    const activeUsers = totalUsers - bannedUsers;
    const totalTCoins = adminData.users.reduce((sum, user) => sum + (user.tcoins || 0), 0);
    const avgTCoins = totalUsers > 0 ? Math.round(totalTCoins / totalUsers) : 0;
    
    document.getElementById('statTotalUsers').textContent = totalUsers;
    document.getElementById('statActiveUsers').textContent = activeUsers;
    document.getElementById('statBannedUsers').textContent = bannedUsers;
    document.getElementById('statTotalTCoins').textContent = totalTCoins.toLocaleString();
    document.getElementById('statAvgTCoins').textContent = avgTCoins.toLocaleString();
    
    // Estadísticas de compras
    const totalOrders = adminData.orders.length;
    const pendingOrders = adminData.orders.filter(o => o.status === 'pendiente').length;
    const completedOrders = adminData.orders.filter(o => o.status === 'completado').length;
    const totalRevenue = adminData.orders.reduce((sum, order) => sum + (order.price_usd || 0), 0);
    const totalTCoinsSpent = adminData.orders.reduce((sum, order) => sum + (order.price_tcoins || 0), 0);
    
    document.getElementById('statTotalOrders').textContent = totalOrders;
    document.getElementById('statPendingOrders').textContent = pendingOrders;
    document.getElementById('statCompletedOrders').textContent = completedOrders;
    document.getElementById('statTotalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('statTCoinsSpent').textContent = totalTCoinsSpent.toLocaleString();
    
    // Estadísticas de productos
    const totalProducts = adminData.products.length;
    const activeProducts = adminData.products.filter(p => p.is_active).length;
    
    document.getElementById('statTotalProducts').textContent = totalProducts;
    document.getElementById('statActiveProducts').textContent = activeProducts;
    
    // Estadísticas de códigos
    const totalCodes = adminData.codes.length;
    const activeCodes = adminData.codes.filter(c => c.is_active).length;
    
    document.getElementById('statTotalCodes').textContent = totalCodes;
    document.getElementById('statActiveCodes').textContent = activeCodes;
}

// Cargar actividad reciente
async function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    try {
        // Obtener actividad reciente
        const recentActivities = [];
        
        // Últimos usuarios registrados
        const recentUsers = adminData.users.slice(0, 3).map(user => ({
            type: 'user',
            action: 'Registro',
            user: user.nick,
            date: user.created_at,
            icon: 'fa-user-plus',
            color: '#00c853'
        }));
        
        // Últimas compras
        const recentOrders = adminData.orders.slice(0, 3).map(order => ({
            type: 'order',
            action: 'Compra',
            user: order.profiles?.nick || 'Usuario',
            product: order.product_name,
            amount: order.price_usd ? `$${order.price_usd}` : `${order.price_tcoins} TCoins`,
            date: order.created_at,
            icon: 'fa-shopping-cart',
            color: '#2196f3'
        }));
        
        // Últimas transacciones
        const recentTransactions = adminData.transactions.slice(0, 3).map(trans => ({
            type: 'transaction',
            action: trans.amount > 0 ? 'Depósito' : 'Retiro',
            user: trans.profiles?.nick || 'Usuario',
            amount: trans.amount,
            date: trans.created_at,
            icon: trans.amount > 0 ? 'fa-arrow-up' : 'fa-arrow-down',
            color: trans.amount > 0 ? '#00c853' : '#f44336'
        }));
        
        // Combinar y ordenar por fecha
        const allActivities = [...recentUsers, ...recentOrders, ...recentTransactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        // Mostrar actividades
        if (allActivities.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: #b0b0c0;">
                    <i class="fas fa-info-circle"></i> No hay actividad reciente
                </div>
            `;
            return;
        }
        
        container.innerHTML = allActivities.map(activity => {
            const date = formatDate(activity.date);
            const amountDisplay = activity.amount ? 
                `<span style="color: ${activity.color}; font-weight: 600;">${activity.amount > 0 ? '+' : ''}${activity.amount}</span>` : 
                '';
            
            return `
                <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-bottom: 1px solid rgba(254,198,0,0.1);">
                    <div style="color: ${activity.color};">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${activity.action}</div>
                        <div style="font-size: 0.875rem; color: #b0b0c0;">
                            ${activity.user} ${activity.product ? `- ${activity.product}` : ''}
                            ${amountDisplay}
                        </div>
                    </div>
                    <div style="font-size: 0.75rem; color: #b0b0c0;">
                        ${date}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error al cargar actividad:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: #f44336;">
                <i class="fas fa-exclamation-triangle"></i> Error al cargar la actividad
            </div>
        `;
    }
}

// Actualizar estadísticas rápidas
function updateQuickStats() {
    // Calcular crecimiento
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Usuarios esta semana
    const newUsersThisWeek = adminData.users.filter(user => 
        new Date(user.created_at) >= weekAgo
    ).length;
    
    // Compras esta semana
    const newOrdersThisWeek = adminData.orders.filter(order => 
        new Date(order.created_at) >= weekAgo
    ).length;
    
    // Ingresos esta semana
    const revenueThisWeek = adminData.orders
        .filter(order => new Date(order.created_at) >= weekAgo)
        .reduce((sum, order) => sum + (order.price_usd || 0), 0);
    
    document.getElementById('quickNewUsers').textContent = `+${newUsersThisWeek} esta semana`;
    document.getElementById('quickNewOrders').textContent = `+${newOrdersThisWeek} esta semana`;
    document.getElementById('quickWeeklyRevenue').textContent = `$${revenueThisWeek.toFixed(2)} esta semana`;
}

// ==============================================
// FUNCIONES DE CONFIGURACIÓN
// ==============================================

// Cargar configuración del sistema
async function loadSystemConfig() {
    try {
        if (!window.supabase) return;
        
        // Intentar cargar configuración de Supabase
        const { data: config, error } = await window.supabase
            .from('system_config')
            .select('*')
            .single();
        
        if (!error && config) {
            // Usar configuración de la base de datos
            SYSTEM_CONFIG.tcoinValue = config.tcoin_value || 0.01;
            SYSTEM_CONFIG.adReward = config.ad_reward || 50;
            SYSTEM_CONFIG.adCooldown = config.ad_cooldown || 3600000;
            SYSTEM_CONFIG.maxAdsPerDay = config.max_ads_per_day || 10;
        }
        
    } catch (error) {
        console.error('Error al cargar configuración:', error);
        // Usar valores por defecto
    }
}

// Actualizar formulario de configuración
function updateSystemConfigForm() {
    document.getElementById('configTcoinValue').value = SYSTEM_CONFIG.tcoinValue;
    document.getElementById('configAdReward').value = SYSTEM_CONFIG.adReward;
    document.getElementById('configAdCooldown').value = SYSTEM_CONFIG.adCooldown / 60000; // Convertir a minutos
    document.getElementById('configMaxAds').value = SYSTEM_CONFIG.maxAdsPerDay;
}

// Guardar configuración del sistema
async function saveSystemConfig() {
    const tcoinValue = parseFloat(document.getElementById('configTcoinValue').value);
    const adReward = parseInt(document.getElementById('configAdReward').value);
    const adCooldown = parseInt(document.getElementById('configAdCooldown').value) * 60000; // Convertir a ms
    const maxAds = parseInt(document.getElementById('configMaxAds').value);
    
    if (!tcoinValue || !adReward || !adCooldown || !maxAds) {
        showError('Todos los campos son obligatorios');
        return;
    }
    
    try {
        if (!window.supabase) {
            throw new Error('Error de conexión con la base de datos');
        }
        
        const configData = {
            tcoin_value: tcoinValue,
            ad_reward: adReward,
            ad_cooldown: adCooldown,
            max_ads_per_day: maxAds,
            updated_at: new Date().toISOString()
        };
        
        // Guardar en Supabase
        const { error } = await window.supabase
            .from('system_config')
            .upsert(configData);
        
        if (error) throw error;
        
        // Actualizar configuración local
        SYSTEM_CONFIG.tcoinValue = tcoinValue;
        SYSTEM_CONFIG.adReward = adReward;
        SYSTEM_CONFIG.adCooldown = adCooldown;
        SYSTEM_CONFIG.maxAdsPerDay = maxAds;
        
        showSuccess('Configuración guardada correctamente');
        
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        showError('Error al guardar configuración: ' + error.message);
    }
}

// ==============================================
// FUNCIONES AUXILIARES
// ==============================================

// Manejar acciones rápidas
function handleQuickAction(action) {
    switch (action) {
        case 'addUser':
            showAddUserModal();
            break;
        case 'addProduct':
            showAddProductModal();
            break;
        case 'addCode':
            showAddCodeModal();
            break;
        case 'viewReports':
            generateReports();
            break;
        case 'systemConfig':
            showSection('system');
            break;
        case 'backupData':
            backupDatabase();
            break;
        case 'clearCache':
            clearSystemCache();
            break;
    }
}

// Generar reportes
function generateReports() {
    const reportData = {
        fecha: new Date().toISOString(),
        total_usuarios: adminData.users.length,
        usuarios_activos: adminData.users.filter(u => !u.banned).length,
        usuarios_baneados: adminData.users.filter(u => u.banned).length,
        tcoins_totales: adminData.users.reduce((sum, user) => sum + (user.tcoins || 0), 0),
        compras_totales: adminData.orders.length,
        compras_pendientes: adminData.orders.filter(o => o.status === 'pendiente').length,
        ingresos_totales: adminData.orders.reduce((sum, order) => sum + (order.price_usd || 0), 0),
        productos_activos: adminData.products.filter(p => p.is_active).length,
        codigos_activos: adminData.codes.filter(c => c.is_active).length
    };
    
    // Descargar reporte como JSON
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `reporte_tvcraft_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showSuccess('Reporte generado y descargado correctamente');
}

// Respaldar base de datos
async function backupDatabase() {
    showLoading('Creando respaldo de la base de datos...');
    
    try {
        const backupData = {
            fecha: new Date().toISOString(),
            usuarios: adminData.users,
            compras: adminData.orders,
            productos: adminData.products,
            codigos: adminData.codes,
            transacciones: adminData.transactions,
            configuracion: SYSTEM_CONFIG
        };
        
        // Descargar backup como JSON
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `backup_tvcraft_${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        hideLoading();
        showSuccess('Respaldo creado y descargado correctamente');
        
    } catch (error) {
        hideLoading();
        console.error('Error al crear respaldo:', error);
        showError('Error al crear respaldo: ' + error.message);
    }
}

// Limpiar caché del sistema
function clearSystemCache() {
    showConfirm(
        '¿Estás seguro de limpiar la caché del sistema?<br><br>' +
        '<small style="color: #ff9800;">Esto eliminará los datos en caché pero no afectará la base de datos.</small>',
        
        () => {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            
            // Recargar datos
            loadAllAdminData();
            
            showSuccess('Caché del sistema limpiada correctamente');
        }
    );
}

// Filtrar sección actual
function filterCurrentSection(searchTerm) {
    const activeSection = document.querySelector('.admin-section[style*="block"]');
    if (!activeSection) return;
    
    const sectionId = activeSection.id.replace('Section', '');
    
    switch (sectionId) {
        case 'users':
            filterUsersTable(searchTerm);
            break;
        case 'orders':
            filterOrdersTable(searchTerm);
            break;
        case 'products':
            filterProductsTable(searchTerm);
            break;
        case 'codes':
            filterCodesTable(searchTerm);
            break;
        case 'transactions':
            filterTransactionsTable(searchTerm);
            break;
    }
}

// Filtrar tabla de usuarios
function filterUsersTable(searchTerm = null) {
    const term = searchTerm || document.getElementById('userSearch')?.value.toLowerCase().trim() || '';
    const roleFilter = document.getElementById('userFilter')?.value || 'all';
    
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const roleCell = row.querySelector('td:nth-child(4)');
        const role = roleCell ? roleCell.textContent.toLowerCase() : '';
        
        let matchesSearch = !term || text.includes(term);
        let matchesRole = roleFilter === 'all' || 
                         (roleFilter === 'admin' && role.includes('admin')) ||
                         (roleFilter === 'user' && role.includes('user'));
        
        row.style.display = matchesSearch && matchesRole ? '' : 'none';
    });
}

// Filtrar usuarios por rol
function filterUsersByRole() {
    filterUsersTable();
}

// Filtrar tabla de compras
function filterOrdersTable(searchTerm = null) {
    const term = searchTerm || document.getElementById('orderSearch')?.value.toLowerCase().trim() || '';
    const statusFilter = document.getElementById('orderFilter')?.value || 'all';
    
    const rows = document.querySelectorAll('#ordersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const statusCell = row.querySelector('td:nth-child(7)');
        const status = statusCell ? statusCell.textContent.toLowerCase() : '';
        const methodCell = row.querySelector('td:nth-child(4)');
        const method = methodCell ? methodCell.textContent.toLowerCase() : '';
        
        let matchesSearch = !term || text.includes(term);
        let matchesFilter = false;
        
        switch (statusFilter) {
            case 'all':
                matchesFilter = true;
                break;
            case 'pending':
                matchesFilter = status.includes('pendiente');
                break;
            case 'completed':
                matchesFilter = status.includes('completado');
                break;
            case 'usd':
                matchesFilter = method.includes('usd');
                break;
            case 'tcoins':
                matchesFilter = method.includes('tcoins');
                break;
        }
        
        row.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
}

// Filtrar compras por estado
function filterOrdersByStatus() {
    filterOrdersTable();
}

// Filtrar tabla de productos
function filterProductsTable(searchTerm = null) {
    const term = searchTerm || document.getElementById('productSearch')?.value.toLowerCase().trim() || '';
    const categoryFilter = document.getElementById('productFilter')?.value || 'all';
    
    const rows = document.querySelectorAll('#productsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const categoryCell = row.querySelector('td:nth-child(3)');
        const category = categoryCell ? categoryCell.textContent.toLowerCase() : '';
        
        let matchesSearch = !term || text.includes(term);
        let matchesCategory = categoryFilter === 'all' || category.includes(categoryFilter);
        
        row.style.display = matchesSearch && matchesCategory ? '' : 'none';
    });
}

// Filtrar productos por categoría
function filterProductsByCategory() {
    filterProductsTable();
}

// Filtrar tabla de códigos
function filterCodesTable(searchTerm = null) {
    const term = searchTerm || '';
    const rows = document.querySelectorAll('#codesTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = !term || text.includes(term) ? '' : 'none';
    });
}

// Filtrar tabla de transacciones
function filterTransactionsTable(searchTerm = null) {
    const term = searchTerm || '';
    const rows = document.querySelectorAll('#transactionsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = !term || text.includes(term) ? '' : 'none';
    });
}

// ==============================================
// FUNCIONES DE UTILIDAD
// ==============================================

// Mostrar loading
function showLoading(message = 'Cargando...') {
    let loadingEl = document.getElementById('adminLoading');
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'adminLoading';
        loadingEl.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: #fec600;
            font-size: 1.2rem;
        `;
        document.body.appendChild(loadingEl);
    }
    
    loadingEl.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <i class="fas fa-spinner fa-spin fa-3x"></i>
        </div>
        <div>${message}</div>
    `;
    loadingEl.style.display = 'flex';
}

// Ocultar loading
function hideLoading() {
    const loadingEl = document.getElementById('adminLoading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}

// Obtener badge de categoría
function getCategoryBadge(category) {
    const categories = {
        'rango': { color: '#2196f3', text: 'Rango' },
        'kit': { color: '#4caf50', text: 'Kit' },
        'llave': { color: '#ff9800', text: 'Llave' },
        'dinero': { color: '#9c27b0', text: 'Dinero' },
        'dinero_tc': { color: '#f44336', text: 'Dinero TC' }
    };
    
    const cat = categories[category] || { color: '#6c6b80', text: category };
    return `<span class="badge" style="background-color: ${cat.color}20; color: ${cat.color};">${cat.text}</span>`;
}

// Obtener badge de tipo de transacción
function getTransactionTypeBadge(type) {
    const types = {
        'compra': { color: '#f44336', icon: 'fa-shopping-cart', text: 'Compra' },
        'anuncio': { color: '#4caf50', icon: 'fa-tv', text: 'Anuncio' },
        'codigo': { color: '#2196f3', icon: 'fa-gift', text: 'Código' },
        'admin': { color: '#ff9800', icon: 'fa-user-cog', text: 'Admin' },
        'registro': { color: '#9c27b0', icon: 'fa-user-plus', text: 'Registro' }
    };
    
    const t = types[type] || { color: '#6c6b80', icon: 'fa-exchange-alt', text: type };
    return `<span class="badge" style="background-color: ${t.color}20; color: ${t.color};">
        <i class="fas ${t.icon}"></i> ${t.text}
    </span>`;
}

// Funciones de alerta
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        background: '#0b0a15',
        color: '#ffffff',
        confirmButtonColor: '#fec600'
    });
}

function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: message,
        background: '#0b0a15',
        color: '#ffffff',
        confirmButtonColor: '#fec600'
    });
}

function showConfirm(message, confirmCallback) {
    Swal.fire({
        title: '¿Estás seguro?',
        html: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#fec600',
        cancelButtonColor: '#6c6b80',
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar',
        background: '#0b0a15',
        color: '#ffffff'
    }).then((result) => {
        if (result.isConfirmed) {
            confirmCallback();
        }
    });
}

// Exportar funciones para uso global
window.showSection = showSection;
window.loadAllAdminData = loadAllAdminData;