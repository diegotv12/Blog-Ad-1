// Productos de la tienda
const products = {
    rangos: [
        { 
            id: 'rango-poseidon', 
            name: 'Rango Poseidon', 
            category: 'rango',
            price_usd: 7, 
            price_tcoins: 500, 
            image: 'RankPoseidon.png',
            description: 'Rango mensual con beneficios exclusivos'
        },
        { 
            id: 'rango-mitico', 
            name: 'Rango Mítico', 
            category: 'rango',
            price_usd: 14, 
            price_tcoins: 900, 
            image: 'RankMitico.png',
            description: 'Rango mensual premium con todos los beneficios'
        }
    ],
    kits: [
        { 
            id: 'kit-poseidon', 
            name: 'Kit Poseidon', 
            category: 'kit',
            price_usd: 5, 
            price_tcoins: 50, 
            image: 'KitPoseidon.png',
            description: 'Kit básico con objetos iniciales'
        },
        { 
            id: 'kit-mitico', 
            name: 'Kit Mítico', 
            category: 'kit',
            price_usd: 12, 
            price_tcoins: 83, 
            image: 'KitMitico.png',
            description: 'Kit avanzado con objetos poderosos'
        }
    ],
    llaves: [
        { 
            id: 'llave-poseidon', 
            name: 'Llave Poseidon', 
            category: 'llave',
            price_usd: 3, 
            price_tcoins: 300, 
            image: 'Key-Poseidon.png', // Cambiado a Key-Poseidon.png
            description: 'Llave para cajas especiales'
        },
        { 
            id: 'llave-mitica', 
            name: 'Llave Mítica', 
            category: 'llave',
            price_usd: 6, 
            price_tcoins: 600, 
            image: 'Key-Mitico.png', // Cambiado a Key-Mitico.png
            description: 'Llave premium para cajas míticas'
        }
    ],
    dinero: [
        { 
            id: 'dinero-100k', 
            name: '100K Dinero', 
            category: 'dinero',
            price_usd: 4, 
            price_tcoins: 60, 
            image: '100k.png',
            description: '100,000 unidades de dinero en el juego'
        },
        { 
            id: 'dinero-250k', 
            name: '250K Dinero', 
            category: 'dinero',
            price_usd: 7, 
            price_tcoins: 85, 
            image: '250k.png',
            description: '250,000 unidades de dinero en el juego'
        },
        { 
            id: 'dinero-510k', 
            name: '510K Dinero', 
            category: 'dinero',
            price_usd: 11, 
            price_tcoins: 0, 
            image: '510k.png',
            description: '510,000 unidades de dinero en el juego'
        },
        { 
            id: 'dinero-1.15m', 
            name: '1.15M Dinero', 
            category: 'dinero',
            price_usd: 16, 
            price_tcoins: 0, 
            image: '1.15M.png',
            description: '1,150,000 unidades de dinero en el juego'
        }
    ],
    // ELIMINADA LA CATEGORÍA dinero_tc completamente
    // Se ha eliminado: dinero_tc: [...]
    
    unban: [ // NUEVA CATEGORÍA
        { 
            id: 'unban-servidor', 
            name: 'Unban (Desbaneo)', 
            category: 'unban',
            price_usd: 6, 
            price_tcoins: 0, // Solo se puede comprar con dinero real
            image: 'unban.png',
            description: 'Desbloquea tu cuenta baneada del servidor'
        }
    ]
};

// Inicializar tienda
document.addEventListener('DOMContentLoaded', async () => {
    await loadStoreProducts();
    setupStoreFilters();
    setupStoreSearch();
});

// Cargar productos en la tienda
async function loadStoreProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    // Mostrar loader
    productsGrid.innerHTML = `
        <div class="loader" style="grid-column: 1 / -1;">
            <div class="loader-spinner"></div>
            <p>Cargando productos...</p>
        </div>
    `;
    
    try {
        // Combinar todos los productos
        let allProducts = [];
        Object.values(products).forEach(category => {
            allProducts = [...allProducts, ...category];
        });
        
        // Función para verificar si el usuario está logueado
        const isLoggedIn = () => {
            return window.currentUser !== null && window.currentUser !== undefined;
        };
        
        // Función para mostrar botón de login si no está logueado
        const getLoginButton = () => {
            return `
                <button class="btn btn-outline login-btn-overlay" onclick="redirectToLogin()">
                    <i class="fas fa-sign-in-alt"></i> Iniciar Sesión para Comprar
                </button>
            `;
        };
        
        // Función para redirigir al login
        window.redirectToLogin = function() {
            window.location.href = 'login.html';
        };
        
        // Crear HTML para los productos
        productsGrid.innerHTML = allProducts.map(product => {
            const hasUSD = product.price_usd > 0;
            const hasTCoins = product.price_tcoins > 0;
            const loggedIn = isLoggedIn();
            
            // Clase adicional para productos que requieren login
            const loginClass = !loggedIn ? 'login-required' : '';
            
            return `
                <div class="product-card ${loginClass}" data-category="${product.category}" 
                     data-id="${product.id}" data-name="${product.name.toLowerCase()}">
                    <div class="product-image">
                        <img src="assets/img/${product.image}" 
                             alt="${product.name}" 
                             onerror="this.src='assets/img/icontvcraftmc.png'">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description" style="color: #b0b0c0; font-size: 0.875rem; margin-bottom: 1rem;">
                            ${product.description}
                        </p>
                        
                        <div class="product-prices">
                            ${hasUSD ? `
                                <div class="price-usd">
                                    <span class="price-label">USD:</span>
                                    <span class="price-value">$${product.price_usd}</span>
                                </div>
                            ` : ''}
                            
                            ${hasTCoins ? `
                                <div class="price-tcoins">
                                    <span class="price-label">TCoins:</span>
                                    <span class="price-value">
                                        <i class="fas fa-coins"></i> ${product.price_tcoins}
                                    </span>
                                </div>
                            ` : ''}
                            
                            ${!hasUSD && !hasTCoins ? `
                                <div class="price-usd">
                                    <span class="price-label">Precio:</span>
                                    <span class="price-value">Consultar</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="product-actions">
                            ${loggedIn ? (hasUSD ? `
                                <button class="btn btn-outline buy-usd" 
                                        data-product='${JSON.stringify(product).replace(/'/g, "&apos;")}'>
                                    <i class="fas fa-dollar-sign"></i> Comprar USD
                                </button>
                            ` : '') : getLoginButton()}
                            
                            ${loggedIn ? (hasTCoins ? `
                                <button class="btn btn-primary buy-tcoins" 
                                        data-product='${JSON.stringify(product).replace(/'/g, "&apos;")}'>
                                    <i class="fas fa-coins"></i> Comprar TCoins
                                </button>
                            ` : '') : (!hasUSD ? getLoginButton() : '')}
                            
                            ${!hasUSD && !hasTCoins && loggedIn ? `
                                <button class="btn btn-outline" disabled>
                                    <i class="fas fa-info-circle"></i> Contactar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Agregar eventos a los botones (solo si el usuario está logueado)
        if (isLoggedIn()) {
            document.querySelectorAll('.buy-usd').forEach(btn => {
                btn.addEventListener('click', handleUSDPurchase);
            });
            
            document.querySelectorAll('.buy-tcoins').forEach(btn => {
                btn.addEventListener('click', handleTCoinsPurchase);
            });
        }
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        productsGrid.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar los productos. Intenta de nuevo más tarde.</p>
            </div>
        `;
    }
}

// Filtrar productos
function setupStoreFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase activa de todos los botones
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase activa al botón clickeado
            button.classList.add('active');
            
            const filter = button.dataset.filter;
            
            // Mostrar/ocultar productos según el filtro
            productCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Configurar búsqueda en tienda
function setupStoreSearch() {
    const searchInput = document.getElementById('storeSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const productName = card.dataset.name;
            const productCategory = card.dataset.category;
            
            // Mostrar si coincide con nombre o categoría
            if (productName.includes(searchTerm) || 
                productCategory.includes(searchTerm) ||
                searchTerm === '') {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Función para verificar login (se usa en las funciones de compra)
function verifyLogin() {
    if (!window.currentUser) {
        showError('Debes iniciar sesión para realizar compras');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        }, 2000);
        return false;
    }
    return true;
}

// Manejar compra con USD
async function handleUSDPurchase(e) {
    if (!verifyLogin()) return;
    
    const product = JSON.parse(e.target.dataset.product.replace(/&apos;/g, "'"));
    
    showConfirm(
        `¿Confirmas la compra de <strong>${product.name}</strong> por <strong>$${product.price_usd} USD</strong>?<br><br>
        <small style="color: #b0b0c0;">Tu pedido será procesado en 24 horas.</small>`,
        
        async () => {
            // Procesar compra con USD
            try {
                if (!window.supabase) {
                    throw new Error('Error de conexión con la base de datos');
                }
                
                // Registrar la orden en Supabase
                const { error } = await window.supabase
                    .from('orders')
                    .insert({
                        user_id: window.currentUser.id,
                        product_id: product.id,
                        product_name: product.name,
                        method: 'usd',
                        price_usd: product.price_usd,
                        price_tcoins: product.price_tcoins,
                        status: 'pendiente',
                        created_at: new Date().toISOString()
                    });
                
                if (error) throw error;
                
                // Registrar transacción si hay base de datos 2
                try {
                    if (window.supabase2) {
                        await window.supabase2
                            .from('compras')
                            .insert({
                                user_id: window.currentUser.id,
                                producto: product.name,
                                metodo: 'usd',
                                monto: product.price_usd,
                                estado: 'pendiente',
                                fecha: new Date().toISOString()
                            });
                    }
                } catch (db2Error) {
                    console.warn('Error al registrar en DB2:', db2Error);
                }
                
                showSuccess('Compra registrada correctamente. Será procesada en 24 horas.');
                
            } catch (error) {
                console.error('Error en compra USD:', error);
                showError('Error al registrar la compra: ' + error.message);
            }
        },
        
        () => {
            console.log('Compra cancelada');
        }
    );
}

// Manejar compra con TCoins
async function handleTCoinsPurchase(e) {
    if (!verifyLogin()) return;
    
    const product = JSON.parse(e.target.dataset.product.replace(/&apos;/g, "'"));
    
    // Obtener saldo actual del usuario
    try {
        if (!window.supabase) {
            throw new Error('Error de conexión con la base de datos');
        }
        
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('tcoins, nick')
            .eq('id', window.currentUser.id)
            .single();
        
        if (error) throw error;
        
        if (profile.tcoins < product.price_tcoins) {
            showError(`No tienes suficientes TCoins.<br><br>
                Necesitas: <strong>${product.price_tcoins} TCoins</strong><br>
                Tienes: <strong>${profile.tcoins} TCoins</strong><br><br>
                Puedes ganar más TCoins viendo anuncios.`);
            return;
        }
        
        showConfirm(
            `¿Confirmas la compra de <strong>${product.name}</strong> por <strong>${product.price_tcoins} TCoins</strong>?<br><br>
            <small style="color: #b0b0c0;">
                Tu saldo actual: ${profile.tcoins} TCoins<br>
                Saldo después: ${profile.tcoins - product.price_tcoins} TCoins
            </small>`,
            
            async () => {
                try {
                    // 1. Actualizar TCoins del usuario
                    const newBalance = profile.tcoins - product.price_tcoins;
                    const { error: updateError } = await window.supabase
                        .from('profiles')
                        .update({ tcoins: newBalance })
                        .eq('id', window.currentUser.id);
                    
                    if (updateError) throw updateError;
                    
                    // 2. Registrar la transacción de TCoins
                    const { error: transError } = await window.supabase
                        .from('tcoins_transactions')
                        .insert({
                            user_id: window.currentUser.id,
                            amount: -product.price_tcoins,
                            type: 'compra',
                            description: `Compra de ${product.name}`,
                            balance_after: newBalance,
                            created_at: new Date().toISOString()
                        });
                    
                    if (transError) throw transError;
                    
                    // 3. Registrar la orden
                    const { error: orderError } = await window.supabase
                        .from('orders')
                        .insert({
                            user_id: window.currentUser.id,
                            product_id: product.id,
                            product_name: product.name,
                            method: 'tcoins',
                            price_usd: product.price_usd,
                            price_tcoins: product.price_tcoins,
                            status: 'completado',
                            created_at: new Date().toISOString()
                        });
                    
                    if (orderError) throw orderError;
                    
                    // 4. Registrar en DB2 si existe
                    try {
                        if (window.supabase2) {
                            // Registrar compra
                            await window.supabase2
                                .from('compras')
                                .insert({
                                    user_id: window.currentUser.id,
                                    producto: product.name,
                                    metodo: 'tcoins',
                                    monto_tcoins: product.price_tcoins,
                                    estado: 'completado',
                                    fecha: new Date().toISOString()
                                });
                            
                            // Registrar evento
                            await window.supabase2
                                .from('user_events')
                                .insert({
                                    user_id: window.currentUser.id,
                                    event_type: 'purchase',
                                    event_data: { 
                                        product: product.name,
                                        price_tcoins: product.price_tcoins,
                                        balance_after: newBalance 
                                    },
                                    created_at: new Date().toISOString()
                                });
                        }
                    } catch (db2Error) {
                        console.warn('Error al registrar en DB2:', db2Error);
                    }
                    
                    showSuccess(`¡Compra exitosa!<br><br>
                        Has adquirido: <strong>${product.name}</strong><br>
                        Nuevo saldo: <strong>${newBalance} TCoins</strong>`);
                    
                } catch (error) {
                    console.error('Error en compra TCoins:', error);
                    showError('Error al procesar la compra: ' + error.message);
                }
            },
            
            () => {
                console.log('Compra cancelada');
            }
        );
        
    } catch (error) {
        console.error('Error al verificar saldo:', error);
        showError('Error al verificar tu saldo: ' + error.message);
    }
}

// Función para obtener estadísticas de la tienda
async function getStoreStats() {
    try {
        if (!window.supabase) return null;
        
        // Obtener estadísticas básicas
        const { data: orders, error } = await window.supabase
            .from('orders')
            .select('*');
        
        if (error) throw error;
        
        const stats = {
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'pendiente').length,
            completedOrders: orders.filter(o => o.status === 'completado').length,
            totalRevenue: orders.reduce((sum, order) => sum + (order.price_usd || 0), 0),
            totalTCoinsSpent: orders.reduce((sum, order) => sum + (order.price_tcoins || 0), 0)
        };
        
        return stats;
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return null;
    }
}

// Inicializar estadísticas si estamos en admin
if (window.location.pathname.includes('admin')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const stats = await getStoreStats();
        if (stats) {
            console.log('Estadísticas de tienda:', stats);
        }
    });
}