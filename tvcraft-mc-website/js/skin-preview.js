// Visualizador de skins simplificado mejorado
document.addEventListener('DOMContentLoaded', () => {
    setupSkinPreview();
    setupDefaultSkinButtons();
});

// Configurar vista previa de skins
function setupSkinPreview() {
    // Buscar todos los inputs de skin URL
    const skinUrlInputs = document.querySelectorAll('input[id*="skin"], input[name*="skin"]');
    
    skinUrlInputs.forEach((input, index) => {
        // Encontrar el contenedor de vista previa
        let previewContainer = input.closest('.form-group')?.nextElementSibling;
        if (!previewContainer || !previewContainer.classList.contains('skin-preview-container')) {
            previewContainer = createSkinPreviewContainer(input);
        }
        
        const previewBox = previewContainer.querySelector('.skin-preview-box') || 
                          previewContainer.querySelector('#skinPreviewBox');
        
        if (!previewBox) return;
        
        // URLs de cabezas predeterminadas
        const defaultHeads = [
            'https://mc-heads.net/head/Steve/100',
            'https://mc-heads.net/head/Alex/100',
            'https://mc-heads.net/head/Villager/100',
            'https://mc-heads.net/head/Chicken/100',
            'https://mc-heads.net/head/Computer/100'
        ];
        
        // Función para actualizar la vista previa
        const updatePreview = (url) => {
            if (!url || url.trim() === '') {
                // Usar Steve por defecto si está vacío
                showDefaultHead(previewBox, defaultHeads[0]);
                return;
            }
            
            // Asegurar que sea una URL de cabeza de Minecraft
            let skinUrl = url;
            if (!url.includes('mc-heads.net')) {
                // Si no es una cabeza de Minecraft, intentar convertirla
                // Nota: mc-heads.net solo funciona con nombres de usuario, no con URLs arbitrarias
                // Para URLs arbitrarias, mostramos la imagen directamente
                skinUrl = url;
            }
            
            // Mostrar loading
            showLoading(previewBox);
            
            // Crear y cargar imagen
            const img = new Image();
            img.onload = () => {
                previewBox.innerHTML = '';
                previewBox.appendChild(img);
            };
            
            img.onerror = () => {
                // Si falla, usar Steve como fallback
                showDefaultHead(previewBox, defaultHeads[0]);
                if (input.value !== defaultHeads[0]) {
                    input.value = defaultHeads[0];
                    showError('La URL de la skin no es válida. Se usará Steve por defecto.');
                }
            };
            
            img.src = skinUrl;
            img.alt = 'Vista previa de skin';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
        };
        
        // Actualizar al cambiar el input
        input.addEventListener('input', (e) => {
            updatePreview(e.target.value);
        });
        
        // Actualizar al cargar la página
        // Si hay valor, usarlo; si no, usar Steve
        if (input.value && input.value.trim() !== '') {
            updatePreview(input.value);
        } else {
            // Si es el formulario de registro, hacer que la skin sea obligatoria
            if (input.hasAttribute('required')) {
                input.value = defaultHeads[0];
                updatePreview(defaultHeads[0]);
            } else {
                showDefaultHead(previewBox, defaultHeads[0]);
            }
        }
        
        // Validar al perder el foco
        input.addEventListener('blur', () => {
            if (input.hasAttribute('required') && (!input.value || input.value.trim() === '')) {
                input.value = defaultHeads[0];
                updatePreview(defaultHeads[0]);
                showError('La skin es obligatoria. Se ha seleccionado Steve por defecto.');
            }
        });
    });
}

// Crear contenedor de vista previa si no existe
function createSkinPreviewContainer(input) {
    const container = document.createElement('div');
    container.className = 'skin-preview-container';
    container.style.marginTop = '1rem';
    container.style.textAlign = 'center';
    
    const label = document.createElement('div');
    label.className = 'skin-preview-label';
    label.textContent = 'Vista previa:';
    label.style.marginBottom = '0.5rem';
    label.style.fontWeight = '500';
    label.style.color = '#ffffff';
    
    const previewBox = document.createElement('div');
    previewBox.className = 'skin-preview-box';
    previewBox.style.width = '120px';
    previewBox.style.height = '120px';
    previewBox.style.margin = '0 auto';
    previewBox.style.border = '2px solid #fec600';
    previewBox.style.borderRadius = '8px';
    previewBox.style.overflow = 'hidden';
    previewBox.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    previewBox.style.position = 'relative';
    
    container.appendChild(label);
    container.appendChild(previewBox);
    
    // Insertar después del input
    input.parentNode.insertBefore(container, input.nextSibling);
    
    return container;
}

// Mostrar cabeza predeterminada
function showDefaultHead(previewBox, headUrl) {
    const img = new Image();
    img.onload = () => {
        previewBox.innerHTML = '';
        previewBox.appendChild(img);
    };
    
    img.onerror = () => {
        previewBox.innerHTML = `
            <div class="default-head" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #b0b0c0;">
                <i class="fas fa-user-circle fa-3x"></i>
            </div>
        `;
    };
    
    img.src = headUrl;
    img.alt = 'Skin predeterminada';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
}

// Mostrar loading
function showLoading(previewBox) {
    previewBox.innerHTML = `
        <div class="skin-loading" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; color: #fec600;">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
        </div>
    `;
}

// Mostrar vista previa de error
function showErrorPreview(previewBox) {
    previewBox.innerHTML = `
        <div class="skin-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #f44336; flex-direction: column; padding: 0.5rem;">
            <i class="fas fa-exclamation-triangle fa-2x"></i>
            <small style="font-size: 0.7rem; margin-top: 0.25rem;">URL inválida</small>
        </div>
    `;
}

// Configurar botones de skins predeterminadas
function setupDefaultSkinButtons() {
    const defaultSkins = [
        { name: 'Steve', url: 'https://mc-heads.net/head/Steve' },
        { name: 'Alex', url: 'https://mc-heads.net/head/Alex' },
        { name: 'Vendedor', url: 'https://mc-heads.net/head/Villager' },
        { name: 'Pato', url: 'https://mc-heads.net/head/Chicken' },
        { name: 'PC', url: 'https://mc-heads.net/head/Computer' }
    ];
    
    document.querySelectorAll('.default-skin-btn').forEach(button => {
        button.addEventListener('click', function() {
            const skinUrl = this.dataset.skinUrl + '/100'; // Asegurar tamaño 100px
            const skinName = this.textContent;
            
            // Buscar el input de skin más cercano
            const formGroup = this.closest('.form-group');
            const skinInput = formGroup?.querySelector('input[id*="skin"], input[name*="skin"]');
            
            if (skinInput) {
                skinInput.value = skinUrl;
                
                // Disparar evento input para actualizar vista previa
                const event = new Event('input', { bubbles: true });
                skinInput.dispatchEvent(event);
                
                // Mostrar mensaje de éxito
                showSkinSelectedMessage(skinName);
            }
        });
    });
}

// Mostrar mensaje cuando se selecciona una skin predeterminada
function showSkinSelectedMessage(skinName) {
    // Crear mensaje temporal
    const message = document.createElement('div');
    message.textContent = `Skin "${skinName}" seleccionada`;
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.backgroundColor = '#00c853';
    message.style.color = 'white';
    message.style.padding = '0.75rem 1rem';
    message.style.borderRadius = '8px';
    message.style.zIndex = '9999';
    message.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    message.style.animation = 'slideIn 0.3s ease';
    
    // Estilos para animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(message);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (message.parentNode) {
                document.body.removeChild(message);
            }
            if (style.parentNode) {
                document.head.removeChild(style);
            }
        }, 300);
    }, 3000);
}

// Función para cargar skin desde URL
function loadSkinFromUrl(url, previewElementId) {
    const previewElement = document.getElementById(previewElementId);
    if (!previewElement) return;
    
    if (!url || url.trim() === '') {
        showDefaultHead(previewElement, 'https://mc-heads.net/head/Steve/100');
        return;
    }
    
    // Mostrar loading
    showLoading(previewElement);
    
    // Crear imagen
    const img = new Image();
    img.onload = () => {
        previewElement.innerHTML = '';
        previewElement.appendChild(img);
    };
    
    img.onerror = () => {
        showErrorPreview(previewElement);
    };
    
    img.src = url;
    img.alt = 'Skin del jugador';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
}

// Validar URL de skin
function isValidSkinUrl(url) {
    try {
        new URL(url);
        
        // Aceptar URLs de mc-heads.net o cualquier imagen
        const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const isImageUrl = validExtensions.some(ext => url.toLowerCase().includes(ext));
        const isMinecraftHead = url.includes('mc-heads.net');
        
        return isImageUrl || isMinecraftHead;
    } catch {
        return false;
    }
}

// Función para forzar la actualización de la vista previa
function forceSkinPreviewUpdate(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
}

// Exportar funciones para uso global
window.loadSkinFromUrl = loadSkinFromUrl;
window.setupSkinPreview = setupSkinPreview;
window.forceSkinPreviewUpdate = forceSkinPreviewUpdate;
window.showDefaultHead = showDefaultHead;
window.isValidSkinUrl = isValidSkinUrl;