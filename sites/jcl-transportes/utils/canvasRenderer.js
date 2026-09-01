/**
 * Utilitário para renderização no canvas
 */
class CanvasRenderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.data = {
            origem: "ORIGEM",
            destino: "DESTINO",
            valor: "0,00",
            obsFinal: ""
        };
        
        // Proporção para FullHD (1080x1920 = 0.5625)
        this.aspectRatio = 1080 / 1920; // 0.5625 (9:16 vertical)
    }

    /**
     * Inicializa o renderizador com o canvas principal
     */
    initialize(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas com id '${canvasId}' não encontrado`);
        }
        
        // Define dimensões baseadas no container
        this.updateCanvasSize();
        
        // Adiciona listener para redimensionamento
        window.addEventListener('resize', () => this.updateCanvasSize());
        
        this.ctx = this.canvas.getContext("2d");
        
        // Configura qualidade de renderização
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    /**
     * Atualiza o tamanho do canvas baseado no container
     */
    updateCanvasSize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calcula dimensões mantendo a proporção 9:16
        let width, height;
        
        if (containerHeight * this.aspectRatio > containerWidth) {
            // Limita pela largura
            width = containerWidth;
            height = width / this.aspectRatio;
        } else {
            // Limita pela altura
            height = containerHeight;
            width = height * this.aspectRatio;
        }
        
        // Define o tamanho de exibição
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        // Define o tamanho real do canvas (mantém a resolução original para qualidade)
        this.canvas.width = 1080; // Resolução base
        this.canvas.height = 1920; // Resolução base
    }

    /**
     * Atualiza os dados de renderização
     */
    updateData(newData) {
        this.data = { ...this.data, ...newData };
    }

    /**
     * Renderiza o template atual
     */
    render(template, bgImage) {
        if (!this.ctx || !template) return;
        
        try {
            // Limpa o canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            template.render(this.ctx, this.data, bgImage);
        } catch (error) {
            console.error("Erro na renderização:", error);
            // Fallback
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#333';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Erro ao renderizar', this.canvas.width/2, this.canvas.height/2);
        }
    }

    /**
     * Gera uma miniatura do template
     */
    generateThumbnail(template, bgImage, scale = 0.08) {
        const thumbCanvas = document.createElement('canvas');
        const thumbCtx = thumbCanvas.getContext('2d');
        
        // Usa a mesma proporção do canvas principal
        const thumbWidth = 1080 * scale;
        const thumbHeight = 1920 * scale;
        
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;
        
        // Configura qualidade
        thumbCtx.imageSmoothingEnabled = true;
        thumbCtx.imageSmoothingQuality = 'medium';
        
        // Dados de exemplo para a miniatura
        const exampleData = {
            origem: "SP",
            destino: "RJ",
            valor: "1.500,00",
            obsFinal: ""
        };
        
        // Renderiza
        try {
            template.render(thumbCtx, exampleData, bgImage);
        } catch (error) {
            // Fallback
            thumbCtx.fillStyle = template.mode === 'dark' ? '#333' : '#fff';
            thumbCtx.fillRect(0, 0, thumbWidth, thumbHeight);
            thumbCtx.fillStyle = template.mode === 'dark' ? '#fff' : '#333';
            thumbCtx.font = '12px Arial';
            thumbCtx.textAlign = 'center';
            thumbCtx.fillText('Template ' + template.id, thumbWidth/2, thumbHeight/2);
        }
        
        return thumbCanvas;
    }

    /**
     * Baixa a imagem renderizada
     */
    download(filename = "frete") {
        if (!this.canvas) return;
        
        try {
            // Cria um canvas temporário com a resolução original
            const downloadCanvas = document.createElement('canvas');
            downloadCanvas.width = 1080;
            downloadCanvas.height = 1920;
            const downloadCtx = downloadCanvas.getContext('2d');
            
            // Redesenha no tamanho original
            const template = templateManager.getCurrentTemplate();
            const bg = imageLoader.getImage(`bg-${template.id}`);
            
            if (template && bg) {
                template.render(downloadCtx, this.data, bg);
            }
            
            const link = document.createElement("a");
            link.download = `${filename}.png`;
            link.href = downloadCanvas.toDataURL("image/png");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Erro ao baixar imagem:", error);
            throw error;
        }
    }
}

// Exporta a instância única
const canvasRenderer = new CanvasRenderer();