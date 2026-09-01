/**
 * Utilitário para carregamento de imagens
 */

class ImageLoader {
    constructor() {
        this.images = {};
        this.loadingPromises = {};
    }

    /**
     * Carrega uma imagem
     */
    loadImage(id, src) {
        // Retorna promise existente se já estiver carregando
        if (this.loadingPromises[id]) {
            return this.loadingPromises[id];
        }
        
        // Retorna imagem se já estiver carregada
        if (this.images[id]) {
            return Promise.resolve(this.images[id]);
        }
        
        // Cria nova promise de carregamento
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.images[id] = img;
                delete this.loadingPromises[id];
                resolve(img);
            };
            
            img.onerror = (error) => {
                delete this.loadingPromises[id];
                console.warn(`Falha ao carregar imagem: ${src}`);
                // Cria imagem de fallback
                this.createFallbackImage(id);
                resolve(this.images[id]);
            };
            
            img.src = src;
        });
        
        this.loadingPromises[id] = promise;
        return promise;
    }

    /**
     * Cria uma imagem de fallback
     */
    createFallbackImage(id) {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Imagem não', 50, 45);
        ctx.fillText('carregada', 50, 60);
        
        const img = new Image();
        img.src = canvas.toDataURL();
        this.images[id] = img;
        
        return img;
    }

    /**
     * Obtém uma imagem carregada
     */
    getImage(id) {
        return this.images[id] || null;
    }

    /**
     * Verifica se uma imagem foi carregada
     */
    isImageLoaded(id) {
        return !!this.images[id];
    }

    /**
     * Limpa cache
     */
    clear() {
        this.images = {};
        this.loadingPromises = {};
    }
}

// Exporta a instância única
const imageLoader = new ImageLoader();