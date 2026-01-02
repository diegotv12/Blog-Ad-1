// Visualizador de cabeza de Minecraft simplificado
class SkinHeadViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.options = {
            width: 100,
            height: 100,
            skinUrl: options.skinUrl || 'https://mc-heads.net/head/Steve',
            showControls: false,
            autoRotate: false,
            rotateSpeed: 0.5,
            ...options
        };
        
        this.init();
    }
    
    init() {
        // Crear contenedor para la cabeza
        this.headContainer = document.createElement('div');
        this.headContainer.style.width = `${this.options.width}px`;
        this.headContainer.style.height = `${this.options.height}px`;
        this.headContainer.style.position = 'relative';
        this.headContainer.style.overflow = 'hidden';
        this.headContainer.style.borderRadius = '8px';
        this.headContainer.style.border = '2px solid #fec600';
        this.headContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        
        // Crear imagen para la cabeza
        this.headImage = document.createElement('img');
        this.headImage.src = this.options.skinUrl;
        this.headImage.alt = 'Skin Head Preview';
        this.headImage.style.width = '100%';
        this.headImage.style.height = '100%';
        this.headImage.style.objectFit = 'cover';
        
        // Manejar error de carga
        this.headImage.onerror = () => {
            this.headImage.src = 'https://mc-heads.net/head/Steve';
        };
        
        // Agregar al contenedor
        this.headContainer.appendChild(this.headImage);
        this.container.appendChild(this.headContainer);
        
        // Agregar controles si está habilitado
        if (this.options.showControls) {
            this.addControls();
        }
        
        // Auto rotar si está habilitado
        if (this.options.autoRotate) {
            this.startAutoRotate();
        }
    }
    
    addControls() {
        const controls = document.createElement('div');
        controls.style.position = 'absolute';
        controls.style.bottom = '10px';
        controls.style.left = '50%';
        controls.style.transform = 'translateX(-50%)';
        controls.style.display = 'flex';
        controls.style.gap = '5px';
        controls.style.opacity = '0.7';
        
        const rotateLeft = this.createControlButton('⟲', () => this.rotate(-30));
        const rotateRight = this.createControlButton('⟳', () => this.rotate(30));
        const reset = this.createControlButton('↺', () => this.resetRotation());
        
        controls.appendChild(rotateLeft);
        controls.appendChild(reset);
        controls.appendChild(rotateRight);
        
        this.headContainer.appendChild(controls);
    }
    
    createControlButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.background = 'rgba(254, 198, 0, 0.8)';
        button.style.color = '#06040f';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.padding = '2px 6px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '12px';
        button.style.fontWeight = 'bold';
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        
        return button;
    }
    
    rotate(degrees) {
        const currentRotation = this.getCurrentRotation();
        const newRotation = currentRotation + degrees;
        this.headImage.style.transform = `rotateY(${newRotation}deg)`;
        this.headImage.style.transition = 'transform 0.3s ease';
    }
    
    getCurrentRotation() {
        const transform = this.headImage.style.transform;
        const match = transform.match(/rotateY\(([-\d.]+)deg\)/);
        return match ? parseFloat(match[1]) : 0;
    }
    
    resetRotation() {
        this.headImage.style.transform = 'rotateY(0deg)';
        this.headImage.style.transition = 'transform 0.3s ease';
    }
    
    startAutoRotate() {
        this.autoRotateInterval = setInterval(() => {
            this.rotate(this.options.rotateSpeed);
        }, 50);
    }
    
    stopAutoRotate() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }
    
    updateSkin(skinUrl) {
        this.headImage.src = skinUrl;
        this.headImage.onerror = () => {
            this.headImage.src = 'https://mc-heads.net/head/Steve';
        };
    }
    
    destroy() {
        this.stopAutoRotate();
        if (this.headContainer && this.headContainer.parentNode) {
            this.headContainer.parentNode.removeChild(this.headContainer);
        }
    }
}

// Función para crear visualizador de cabeza
function createSkinHeadPreview(containerId, skinUrl, options = {}) {
    return new SkinHeadViewer(containerId, {
        skinUrl,
        ...options
    });
}

// Exportar para uso global
window.SkinHeadViewer = SkinHeadViewer;
window.createSkinHeadPreview = createSkinHeadPreview;

// Inicializar automáticamente si hay contenedores con data-skin-url
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-skin-preview]').forEach(container => {
        const skinUrl = container.dataset.skinUrl || 'https://mc-heads.net/head/Steve';
        const options = {
            width: container.dataset.width || 100,
            height: container.dataset.height || 100,
            showControls: container.dataset.controls === 'true',
            autoRotate: container.dataset.autoRotate === 'true'
        };
        
        createSkinHeadPreview(container.id, skinUrl, options);
    });
});