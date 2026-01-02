// Head Viewer para perfil.html - CON SKINS ACTUALIZADAS
class HeadViewer {
    constructor() {
        this.canvas = document.getElementById('head-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.skinImage = null;
        this.rotationAngle = 0;
        this.zoomLevel = 1.0;
        this.isLoading = false;
        
        // URLs de skins por defecto ACTUALIZADAS
        this.defaultSkins = {
            steve: 'https://i.postimg.cc/mrHhCNY1/stive3D.png',
            alex: 'https://i.postimg.cc/FRbRnrC6/Alex3D.png',
            vendedor: 'http://texturas.minecraft.net/textura/5fb384a04c4cf57d2954b77d060d8907b9c366bc5d21353fbf4549e32cf00cfb',
            pato: 'http://textures.minecraft.net/texture/91827d03211b6a45ac65a3c4e9f16d6d03525b1dbc7be05030000ce6e431cf96',
            pc: 'http://textures.minecraft.net/texture/91d739d48264d4eaf04fc385e842ba1a1e277e3f3cb49a9826160305e6e1bfbf'
        };
        
        // Coordenadas de la cabeza en la skin
        this.headCoords = {
            front: { x: 8, y: 8, width: 8, height: 8 },
            top: { x: 8, y: 0, width: 8, height: 8 },
            right: { x: 0, y: 8, width: 8, height: 8 }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initCanvas();
        this.loadUserSkin();
    }
    
    setupEventListeners() {
        // Botón cargar
        document.getElementById('load-head-btn').addEventListener('click', () => {
            const url = document.getElementById('head-skin-url').value.trim();
            this.loadSkinFromUrl(url);
        });
        
        // Cargar con Enter
        document.getElementById('head-skin-url').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('load-head-btn').click();
            }
        });
        
        // Controles
        document.getElementById('rotate-left').addEventListener('click', () => this.rotate(-15));
        document.getElementById('rotate-right').addEventListener('click', () => this.rotate(15));
        document.getElementById('zoom-in').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoom-out').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());
        
        // Skins rápidas
        document.querySelectorAll('.quick-skin-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const skinType = btn.dataset.skin;
                this.loadQuickSkin(skinType);
            });
        });
        
        // Arrastrar y soltar
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.canvas.style.boxShadow = '0 10px 30px var(--glow-color)';
        });
        
        this.canvas.addEventListener('dragleave', () => {
            this.canvas.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        });
        
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('head-skin-url').value = event.target.result;
                    this.loadSkinFromUrl(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    initCanvas() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fondo
        this.ctx.fillStyle = 'rgba(11, 10, 21, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Mensaje de bienvenida
        this.ctx.fillStyle = 'var(--supernova)';
        this.ctx.font = 'bold 22px Montserrat';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CARGA TU SKIN', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.fillStyle = 'var(--text-secondary)';
        this.ctx.font = '16px Montserrat';
        this.ctx.fillText('para ver tu cabeza aquí', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // Borde
        this.ctx.strokeStyle = 'var(--border-color)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
    }
    
    async loadUserSkin() {
        try {
            // Intentar cargar la skin del usuario si está logueado
            const user = window.currentUser ? window.currentUser() : null;
            if (user) {
                const profile = window.userProfile ? window.userProfile() : null;
                if (profile && profile.skin_url) {
                    await this.loadSkinFromUrl(profile.skin_url);
                    document.getElementById('head-skin-url').value = profile.skin_url;
                } else {
                    // Si no tiene skin, cargar Steve por defecto
                    await this.loadSkinFromUrl(this.defaultSkins.steve);
                    document.getElementById('head-skin-url').value = this.defaultSkins.steve;
                }
            } else {
                // Usuario no logueado, cargar Steve por defecto
                await this.loadSkinFromUrl(this.defaultSkins.steve);
                document.getElementById('head-skin-url').value = this.defaultSkins.steve;
            }
        } catch (error) {
            console.log('No se pudo cargar skin del usuario:', error);
            // Fallback a Steve
            await this.loadSkinFromUrl(this.defaultSkins.steve);
            document.getElementById('head-skin-url').value = this.defaultSkins.steve;
        }
    }
    
    async loadQuickSkin(type) {
        const url = this.defaultSkins[type];
        if (url) {
            document.getElementById('head-skin-url').value = url;
            await this.loadSkinFromUrl(url);
        }
    }
    
    async loadSkinFromUrl(url) {
        if (!url) {
            this.showNotification('Ingresa una URL válida', 'error');
            return;
        }
        
        this.setLoading(true);
        
        try {
            // Crear una nueva imagen
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            // Cargar la imagen
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => {
                    // Si falla, intentar con método alternativo
                    console.log('Error cargando skin, intentando método alternativo...');
                    this.loadSkinWithProxy(url).then(resolve).catch(reject);
                };
                img.src = url + '?t=' + new Date().getTime(); // Cache buster
            });
            
            // Verificar si es una skin de Minecraft
            const isValidSkin = (img.width === 64 && (img.height === 64 || img.height === 32)) || 
                               (img.width === 128 && (img.height === 128 || img.height === 64)) ||
                               (img.width === 512 && (img.height === 512 || img.height === 256)); // Texturas HD
            
            this.skinImage = img;
            
            // Redibujar canvas
            this.drawHead();
            
            if (isValidSkin) {
                this.showNotification('Cabeza cargada correctamente', 'success');
            } else {
                this.showNotification('Imagen cargada (puede no ser una skin estándar)', 'warning');
            }
            
        } catch (error) {
            console.error('Error cargando la skin:', error);
            this.showNotification('Error al cargar. Verifica la URL.', 'error');
            
            // Fallback a Steve
            await this.loadSkinFromUrl(this.defaultSkins.steve);
        } finally {
            this.setLoading(false);
        }
    }
    
    async loadSkinWithProxy(url) {
        // Método alternativo para cargar skins con problemas CORS
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // Para texturas de Minecraft.net, podemos usar un proxy simple
            if (url.includes('textures.minecraft.net') || url.includes('texturas.minecraft.net')) {
                // Las texturas de Minecraft permiten CORS
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = url;
            } else {
                // Para otras URLs, intentar sin CORS
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = 'https://corsproxy.io/?' + encodeURIComponent(url);
            }
        });
    }
    
    drawHead() {
        if (!this.skinImage) return;
        
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fondo
        this.ctx.fillStyle = 'rgba(11, 10, 21, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Guardar estado del contexto
        this.ctx.save();
        
        // Mover al centro
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        
        // Aplicar rotación
        this.ctx.rotate(this.rotationAngle * Math.PI / 180);
        
        // Aplicar zoom
        this.ctx.scale(this.zoomLevel, this.zoomLevel);
        
        // Dibujar cabeza en 3D simplificado
        this.drawCubeFace(this.headCoords.front, 0, 0, 150, 150);
        
        // Borde con efecto glow
        this.ctx.strokeStyle = 'var(--supernova)';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = 'var(--supernova)';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeRect(-75, -75, 150, 150);
        this.ctx.shadowBlur = 0;
        
        // Restaurar estado
        this.ctx.restore();
        
        // Información de la skin
        this.ctx.fillStyle = 'var(--text-secondary)';
        this.ctx.font = '12px Montserrat';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `${this.skinImage.width}×${this.skinImage.height}`, 
            this.canvas.width / 2, 
            this.canvas.height - 10
        );
    }
    
    drawCubeFace(faceCoords, x, y, width, height) {
        if (!this.skinImage) return;
        
        // Crear canvas temporal para la cara
        const faceCanvas = document.createElement('canvas');
        const faceCtx = faceCanvas.getContext('2d');
        
        // Ajustar tamaño según la skin
        const isHDSkin = this.skinImage.width >= 128;
        const scale = isHDSkin ? this.skinImage.width / 64 : 1;
        
        faceCanvas.width = faceCoords.width * scale;
        faceCanvas.height = faceCoords.height * scale;
        
        // Ajustar coordenadas para skins HD
        const scaledCoords = {
            x: faceCoords.x * scale,
            y: faceCoords.y * scale,
            width: faceCoords.width * scale,
            height: faceCoords.height * scale
        };
        
        // Ajustar para skins de 64x32 (formato antiguo)
        if (this.skinImage.height === 32 * scale) {
            const oldSkinHead = { 
                x: 8 * scale, 
                y: 8 * scale, 
                width: 8 * scale, 
                height: 8 * scale 
            };
            faceCtx.drawImage(
                this.skinImage, 
                oldSkinHead.x, oldSkinHead.y, oldSkinHead.width, oldSkinHead.height,
                0, 0, oldSkinHead.width, oldSkinHead.height
            );
        } else {
            // Skin estándar
            faceCtx.drawImage(
                this.skinImage, 
                scaledCoords.x, scaledCoords.y, scaledCoords.width, scaledCoords.height,
                0, 0, scaledCoords.width, scaledCoords.height
            );
        }
        
        // Dibujar en el canvas principal con pixel perfect para skins estándar
        this.ctx.imageSmoothingEnabled = !isHDSkin;
        this.ctx.drawImage(faceCanvas, x - width/2, y - height/2, width, height);
    }
    
    rotate(angle) {
        this.rotationAngle += angle;
        this.drawHead();
    }
    
    zoom(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.5, Math.min(this.zoomLevel, 3.0));
        this.drawHead();
    }
    
    resetView() {
        this.rotationAngle = 0;
        this.zoomLevel = 1.0;
        this.drawHead();
        this.showNotification('Vista restablecida', 'info');
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        const loadingElement = document.getElementById('loading');
        if (loading) {
            loadingElement.classList.add('active');
        } else {
            loadingElement.classList.remove('active');
        }
    }
    
    showNotification(message, type) {
        // Usar SweetAlert2 si está disponible
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });
            
            Toast.fire({
                icon: type,
                title: message
            });
        } else {
            // Fallback a alerta simple
            alert(message);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de perfil
    if (document.getElementById('head-canvas')) {
        window.headViewer = new HeadViewer();
    }
});

// Exportar para uso en profile.js
export default HeadViewer;