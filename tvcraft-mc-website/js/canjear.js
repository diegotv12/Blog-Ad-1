// Variables globales
let redeemHistory = [];
let availableCodes = [];

// Inicializar sistema de canjes
document.addEventListener('DOMContentLoaded', async () => {
    await initializeRedeemSystem();
    setupRedeemForm();
    loadRecentCodes();
});

// Inicializar sistema de canjes
async function initializeRedeemSystem() {
    if (!window.currentUser) {
        showLoginRequired();
        return;
    }
    
    try {
        // Cargar códigos disponibles
        await loadAvailableCodes();
        
        // Cargar historial de canjes
        await loadRedeemHistory();
        
    } catch (error) {
        console.error('Error al inicializar sistema de canjes:', error);
    }
}

// Mostrar mensaje de inicio de sesión requerido
function showLoginRequired() {
    const redeemCard = document.querySelector('.redeem-card');
    if (!redeemCard) return;
    
    redeemCard.innerHTML = `
        <div class="redeem-icon">
            <i class="fas fa-user-lock"></i>
        </div>
        
        <h3>Inicia Sesión</h3>
        <p>Debes iniciar sesión para canjear códigos</p>
        
        <div style="margin-top: 2rem;">
            <a href="login.html?redirect=canjear.html" class="btn btn-primary" style="width: 100%;">
                <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
            </a>
        </div>
    `;
}

// Cargar códigos disponibles
async function loadAvailableCodes() {
    try {
        if (!window.supabase) return;
        
        const { data, error } = await window.supabase
            .from('redeem_codes')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        availableCodes = data || [];
        
        // Actualizar lista de códigos recientes
        updateRecentCodesList();
        
    } catch (error) {
        console.error('Error al cargar códigos disponibles:', error);
        availableCodes = [];
    }
}

// Cargar historial de canjes
async function loadRedeemHistory() {
    if (!window.currentUser) return;
    
    try {
        // Intentar cargar de DB1
        if (window.supabase) {
            const { data, error } = await window.supabase
                .from('code_redemptions')
                .select('*')
                .eq('user_id', window.currentUser.id)
                .order('created_at', { ascending: false });
            
            if (error && error.code !== 'PGRST116') throw error;
            
            if (data) {
                redeemHistory = data;
                updateRedeemHistoryTable();
                return;
            }
        }
        
        // Si no hay datos en DB1, intentar con DB2
        if (window.supabase2) {
            const { data, error } = await window.supabase2
                .from('code_redemptions_detail')
                .select('*')
                .eq('user_id', window.currentUser.id)
                .order('created_at', { ascending: false });
            
            if (error && error.code !== 'PGRST116') throw error;
            
            if (data) {
                redeemHistory = data;
                updateRedeemHistoryTable();
                return;
            }
        }
        
    } catch (error) {
        console.error('Error al cargar historial de canjes:', error);
        redeemHistory = [];
    }
}

// Configurar formulario de canje
function setupRedeemForm() {
    const redeemForm = document.getElementById('redeemBtn');
    const codeInput = document.getElementById('codeInput');
    
    if (!redeemForm || !codeInput) return;
    
    // Canjear al hacer clic en el botón
    redeemForm.addEventListener('click', handleRedeem);
    
    // Canjear al presionar Enter en el input
    codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleRedeem();
        }
    });
    
    // Convertir a mayúsculas automáticamente
    codeInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
}

// Manejar canje de código
async function handleRedeem() {
    if (!window.currentUser) {
        showError('Debes iniciar sesión para canjear códigos');
        return;
    }
    
    const codeInput = document.getElementById('codeInput');
    const redeemBtn = document.getElementById('redeemBtn');
    const redeemResult = document.getElementById('redeemResult');
    
    if (!codeInput || !redeemBtn) return;
    
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code) {
        showError('Por favor, ingresa un código');
        return;
    }
    
    // Validar formato básico
    if (code.length < 5 || code.length > 20) {
        showError('El código debe tener entre 5 y 20 caracteres');
        return;
    }
    
    // Deshabilitar botón y mostrar loading
    const originalText = redeemBtn.innerHTML;
    redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    redeemBtn.disabled = true;
    
    try {
        // Verificar código
        const result = await verifyAndRedeemCode(code);
        
        // Mostrar resultado
        showRedeemResult(result);
        
        if (result.success) {
            // Limpiar input
            codeInput.value = '';
            
            // Recargar historial
            await loadRedeemHistory();
            await loadAvailableCodes();
            
            // Actualizar perfil si es necesario
            if (window.updateProfileUI) {
                window.updateProfileUI();
            }
        }
        
    } catch (error) {
        console.error('Error en canje:', error);
        showError('Error al procesar el código: ' + error.message);
    } finally {
        // Restaurar botón
        redeemBtn.innerHTML = originalText;
        redeemBtn.disabled = false;
    }
}

// Verificar y canjear código
async function verifyAndRedeemCode(code) {
    try {
        if (!window.supabase) {
            throw new Error('Error de conexión');
        }
        
        // Buscar código en DB1
        const { data: codeData, error: codeError } = await window.supabase
            .from('redeem_codes')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();
        
        if (codeError || !codeData) {
            return {
                success: false,
                message: 'Código inválido o ya utilizado'
            };
        }
        
        // Verificar si el usuario ya canjeó este código
        const { data: existingRedemption, error: redemptionError } = await window.supabase
            .from('code_redemptions')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .eq('code', code)
            .single();
        
        if (!redemptionError && existingRedemption) {
            return {
                success: false,
                message: 'Ya has canjeado este código'
            };
        }
        
        // Procesar recompensa
        let rewardMessage = '';
        
        if (codeData.reward_type === 'tcoin') {
            // Recompensa en TCoins
            const rewardAmount = codeData.reward_value;
            
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
                    type: 'codigo',
                    description: `Canje de código: ${code}`,
                    balance_after: newBalance,
                    created_at: new Date().toISOString()
                });
            
            if (transError) throw transError;
            
            rewardMessage = `+${rewardAmount} TCoins`;
            
        } else if (codeData.reward_type === 'item') {
            // Recompensa en items (registrar en órdenes)
            const { error: orderError } = await window.supabase
                .from('orders')
                .insert({
                    user_id: window.currentUser.id,
                    product_id: 'codigo-' + code,
                    product_name: codeData.reward_value,
                    method: 'codigo',
                    status: 'completado',
                    created_at: new Date().toISOString()
                });
            
            if (orderError) throw orderError;
            
            rewardMessage = codeData.reward_value;
        }
        
        // Registrar canje en DB1
        const { error: redemptionInsertError } = await window.supabase
            .from('code_redemptions')
            .insert({
                user_id: window.currentUser.id,
                code: code,
                reward_type: codeData.reward_type,
                reward_value: codeData.reward_value,
                created_at: new Date().toISOString()
            });
        
        if (redemptionInsertError) throw redemptionInsertError;
        
        // Registrar en DB2 si está disponible
        if (window.supabase2) {
            try {
                await window.supabase2
                    .from('code_redemptions_detail')
                    .insert({
                        user_id: window.currentUser.id,
                        code: code,
                        reward_type: codeData.reward_type,
                        reward_value: codeData.reward_value,
                        redeemed_at: new Date().toISOString()
                    });
            } catch (db2Error) {
                console.warn('Error al registrar en DB2:', db2Error);
            }
        }
        
        // Desactivar código si es de un solo uso
        if (codeData.single_use) {
            const { error: deactivateError } = await window.supabase
                .from('redeem_codes')
                .update({ is_active: false })
                .eq('code', code);
            
            if (deactivateError) throw deactivateError;
        }
        
        return {
            success: true,
            message: `¡Código canjeado exitosamente! Recompensa: ${rewardMessage}`,
            reward: codeData.reward_value,
            rewardType: codeData.reward_type
        };
        
    } catch (error) {
        console.error('Error en verifyAndRedeemCode:', error);
        throw error;
    }
}

// Mostrar resultado del canje
function showRedeemResult(result) {
    const redeemResult = document.getElementById('redeemResult');
    if (!redeemResult) return;
    
    if (result.success) {
        redeemResult.innerHTML = `
            <div style="padding: 1rem; background-color: rgba(0, 200, 83, 0.1); border-radius: 8px; border: 1px solid rgba(0, 200, 83, 0.3);">
                <div style="display: flex; align-items: center; gap: 0.5rem; color: #00c853;">
                    <i class="fas fa-check-circle"></i>
                    <strong>¡Éxito!</strong>
                </div>
                <p style="margin-top: 0.5rem; color: #ffffff;">${result.message}</p>
            </div>
        `;
    } else {
        redeemResult.innerHTML = `
            <div style="padding: 1rem; background-color: rgba(244, 67, 54, 0.1); border-radius: 8px; border: 1px solid rgba(244, 67, 54, 0.3);">
                <div style="display: flex; align-items: center; gap: 0.5rem; color: #f44336;">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Error</strong>
                </div>
                <p style="margin-top: 0.5rem; color: #ffffff;">${result.message}</p>
            </div>
        `;
    }
    
    redeemResult.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        redeemResult.style.display = 'none';
    }, 5000);
}

// Cargar códigos recientes
function loadRecentCodes() {
    // Códigos de ejemplo (en producción vendrían de la BD)
    const exampleCodes = [
        { code: 'WELCOME-2024', reward: '100 TCoins', status: 'active' },
        { code: 'SUMMER-FUN', reward: 'Kit Poseidon', status: 'redeemed' },
        { code: 'NEWPLAYER50', reward: '50 TCoins', status: 'active' }
    ];
    
    updateRecentCodesList(exampleCodes);
}

// Actualizar lista de códigos recientes
function updateRecentCodesList(codes = null) {
    const recentCodesEl = document.getElementById('recentCodes');
    if (!recentCodesEl) return;
    
    const codesToShow = codes || availableCodes.slice(0, 3);
    
    if (codesToShow.length === 0) {
        recentCodesEl.innerHTML = `
            <div class="code-item">
                <div class="code-value">No hay códigos disponibles</div>
                <div class="code-reward">Vuelve más tarde</div>
            </div>
        `;
        return;
    }
    
    recentCodesEl.innerHTML = codesToShow.map(code => {
        const isRedeemed = code.status === 'redeemed' || 
                          (window.currentUser && redeemHistory.some(h => h.code === code.code));
        
        return `
            <div class="code-item ${isRedeemed ? 'redeemed' : ''}">
                <div class="code-value">${code.code}</div>
                <div class="code-reward">${code.reward || code.reward_value}</div>
                <div class="code-status ${isRedeemed ? 'status-redeemed' : 'status-active'}">
                    ${isRedeemed ? 'Canjeado' : 'Activo'}
                </div>
            </div>
        `;
    }).join('');
}

// Actualizar tabla de historial de canjes
function updateRedeemHistoryTable() {
    const historySection = document.getElementById('redeemHistorySection');
    const historyTable = document.getElementById('redeemHistory');
    
    if (!historySection || !historyTable) return;
    
    if (redeemHistory.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    
    // Crear filas de la tabla
    const tbody = historyTable.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = redeemHistory.map(redemption => {
        const date = window.formatDate ? 
            window.formatDate(redemption.created_at || redemption.redeemed_at) : 
            new Date(redemption.created_at || redemption.redeemed_at).toLocaleDateString();
        
        const rewardClass = redemption.reward_type === 'tcoin' ? 'reward-coin' : 'reward-item';
        const rewardIcon = redemption.reward_type === 'tcoin' ? 
            '<i class="fas fa-coins"></i> ' : 
            '<i class="fas fa-gift"></i> ';
        
        return `
            <tr>
                <td>${redemption.code}</td>
                <td class="${rewardClass}">${rewardIcon}${redemption.reward_value}</td>
                <td>${date}</td>
                <td><span class="status-completado">Canjeado</span></td>
            </tr>
        `;
    }).join('');
}