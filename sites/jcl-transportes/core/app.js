/**
 * Aplicação principal do Gerador de Anúncios de Frete
 */
class App {
    constructor() {
        this.templateManager = templateManager;
        this.imageLoader = imageLoader;
        this.canvasRenderer = canvasRenderer;
        
        this.formData = {
            origem: "",
            obsOrigem: "",
            destino: "",
            obsDestino: "",
            valor: "",
            obs: "",
            contacts: [""],
            customImage: null,
        };
        
        this.advancedSettings = {};
        
        // Referências aos elementos do painel lateral
        this.settingsPanel = document.getElementById('settingsPanel');
        this.settingsContent = document.getElementById('settingsContent');
        this.settingsTitle = document.getElementById('settingsTitle');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.overlay = null;
        
        this.currentElement = null;
        
        this.init();
    }

    async init() {
        this.canvasRenderer.initialize("canvas");
        this.setupEventListeners();
        this.setupSettingsPanelEvents();

        await this.loadAllTemplateImages();
        await this.loadModBannerImage(); // ← agora aguarda
        this.createTemplatePreviews();
        this.updateCanvas();
    }

    async loadAllTemplateImages() {
        try {
            const templates = this.templateManager.getAllTemplates();
            this.showLoading(true, "Carregando templates...");
            
            const promises = [];
            for (const [id, template] of Object.entries(templates)) {
                promises.push(this.imageLoader.loadImage(`bg-${id}`, template.bgImage));
            }
            
            await Promise.race([
                Promise.allSettled(promises),
                new Promise(resolve => setTimeout(resolve, 10000))
            ]);
            
            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            this.showError("Erro ao carregar templates.");
        }
    }

    setupEventListeners() {
        const inputIds = ["origem", "obsOrigem", "destino", "obsDestino", "valor", "obs"];
        inputIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener("input", () => this.onInputChange(id));
            }
        });

        const downloadBtn = document.getElementById("downloadBtn");
        if (downloadBtn) {
            downloadBtn.addEventListener("click", () => this.onDownloadClick());
        }

        document.querySelectorAll('.btn-input-config').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const target = e.currentTarget.dataset.target;
                this.toggleSettingsPanel(target);
            });
        });

        // Contatos dinâmicos
        this.renderContactInputs();

        const addContactBtn = document.getElementById("addContactBtn");
        if (addContactBtn) {
            addContactBtn.addEventListener("click", () => this.addContact());
        }

    }

    renderContactInputs() {
        const container = document.getElementById("contactsList");
        if (!container) return;

        container.innerHTML = "";
        this.formData.contacts.forEach((val, index) => {
            const row = document.createElement("div");
            row.className = "contact-row";
            row.dataset.index = index;
            row.innerHTML = `
                <input type="text" class="contact-input" placeholder="Telefone / Contato (ex: (63) 99999-9999)" value="${val}">
                <button type="button" class="btn-remove-contact" title="Remover contato" ${this.formData.contacts.length === 1 ? 'style="display:none"' : ''}>
                    <i class="fas fa-minus"></i>
                </button>
            `;
            row.querySelector(".contact-input").addEventListener("input", (e) => {
                this.formData.contacts[index] = e.target.value;
                this.updateCanvas();
            });
            row.querySelector(".btn-remove-contact").addEventListener("click", () => {
                this.removeContact(index);
            });
            container.appendChild(row);
        });
    }

    addContact() {
        this.formData.contacts.push("");
        this.renderContactInputs();
        // Foca no novo campo
        const rows = document.querySelectorAll(".contact-row");
        if (rows.length > 0) {
            rows[rows.length - 1].querySelector(".contact-input").focus();
        }
    }

    removeContact(index) {
        if (this.formData.contacts.length <= 1) return;
        this.formData.contacts.splice(index, 1);
        this.renderContactInputs();
        this.updateCanvas();
    }

    loadModBannerImage() {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.formData.customImage = img;
                resolve(img);
            };
            img.onerror = () => {
                this.formData.customImage = null;
                resolve(null);
            };
            img.src = './assets/mod-banner.png';
        });
    }

    setupSettingsPanelEvents() {
        if (this.closeSettingsBtn) {
            this.closeSettingsBtn.addEventListener('click', () => this.closeSettingsPanel());
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsPanel.classList.contains('active')) {
                this.closeSettingsPanel();
            }
        });
        
        this.createOverlay();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';
        this.overlay.addEventListener('click', () => this.closeSettingsPanel());
        document.body.appendChild(this.overlay);
    }

    toggleSettingsPanel(elementId) {
        if (this.currentElement === elementId && this.settingsPanel.classList.contains('active')) {
            this.closeSettingsPanel();
        } else {
            if (this.currentElement && this.currentElement !== elementId) {
                this.updateConfigButtonIcon(this.currentElement, false);
            }
            this.openSettingsPanel(elementId);
        }
    }

    openSettingsPanel(elementId) {
        if (!this.settingsPanel || !this.settingsContent) return;
        
        this.currentElement = elementId;
        
        const elementNames = {
            'origem': 'Origem',
            'obsOrigem': 'Observação Origem',
            'destino': 'Destino',
            'obsDestino': 'Observação Destino',
            'valor': 'Valor',
            'contact': 'Contato',
        };
        
        this.settingsTitle.textContent = `Configurar ${elementNames[elementId]}`;
        this.createElementControls(elementId);
        
        this.settingsPanel.classList.add('active');
        document.querySelector('.container').classList.add('with-settings-panel');
        
        if (window.innerWidth <= 768 && this.overlay) {
            this.overlay.classList.add('active');
        }
        
        this.updateConfigButtonIcon(elementId, true);
    }

    closeSettingsPanel() {
        if (!this.settingsPanel) return;
        
        this.settingsPanel.classList.remove('active');
        document.querySelector('.container').classList.remove('with-settings-panel');
        
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
        
        if (this.currentElement) {
            this.updateConfigButtonIcon(this.currentElement, false);
        }
        
        this.currentElement = null;
        this.settingsContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sliders-h"></i>
                <p>Selecione um campo para configurar</p>
            </div>
        `;
    }

    updateConfigButtonIcon(elementId, isOpen) {
        const btn = document.querySelector(`.btn-input-config[data-target="${elementId}"]`);
        if (!btn) return;
        
        const icon = btn.querySelector('i');
        if (isOpen) {
            icon.className = 'fas fa-times';
            btn.classList.add('active');
            btn.style.background = '#ff003d';
            btn.title = 'Fechar configurações';
        } else {
            icon.className = 'fas fa-sliders-h';
            btn.classList.remove('active');
            btn.style.background = '';
            btn.title = 'Configurar estilo';
        }
    }

    createElementControls(elementId) {
        if (!this.settingsContent) return;
        
        const settings = this.advancedSettings[elementId] || {};
        const defaultFontSize = this.getDefaultFontSize(elementId);
        const defaultColor = this.getDefaultColor(elementId);
        const currentFontSize = settings.fontSize || defaultFontSize;
        const currentColor = settings.color || defaultColor;
        const currentYOffset = settings.yOffset || 0;
        const currentFontWeight = settings.fontWeight || 'bold';
        
        this.settingsContent.innerHTML = `
            <div class="control-group">
                <label>Tamanho da fonte:</label>
                <div class="font-size-control">
                    <button class="font-size-btn decrease" data-action="decrease">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="font-size-value" id="fontSize-${elementId}">${currentFontSize}</span>
                    <button class="font-size-btn increase" data-action="increase">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            
            <div class="control-group">
                <label>Cor da fonte:</label>
                <div class="color-control">
                    <input type="color" class="color-input" id="color-${elementId}" value="${currentColor}">
                    <span class="color-hex" id="colorHex-${elementId}">${currentColor}</span>
                </div>
            </div>
            
            <div class="control-group">
                <label>Posição vertical:</label>
                <div class="position-control">
                    <input type="range" class="vertical-slider" id="position-${elementId}" 
                           min="-100" max="100" value="${currentYOffset}" orient="vertical">
                    <span class="position-value" id="positionValue-${elementId}">${currentYOffset}px</span>
                </div>
            </div>
            
            <div class="control-group">
                <label>Tipo de fonte:</label>
                <div class="font-style-control">
                    <button class="font-style-btn ${currentFontWeight === 'bold' ? 'active' : ''}" 
                            data-style="bold" id="bold-${elementId}">
                        <strong>B</strong>
                    </button>
                    <button class="font-style-btn ${currentFontWeight === 'light' ? 'active' : ''}" 
                            data-style="light" id="light-${elementId}">
                        <span style="font-weight: 300">L</span>
                    </button>
                    <button class="font-style-btn ${currentFontWeight === 'italic' ? 'active' : ''}" 
                            data-style="italic" id="italic-${elementId}">
                        <em>I</em>
                    </button>
                </div>
            </div>
            
            <div class="control-group">
                <button class="btn-reset-settings" data-element="${elementId}" style="
                    width: 100%;
                    padding: 10px;
                    background: #666;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: 'Lufga', Arial, sans-serif;
                    font-weight: 600;
                    margin-top: 20px;
                ">
                    <i class="fas fa-undo"></i> Redefinir para padrão
                </button>
            </div>
        `;
        
        this.setupControlEvents(elementId);
    }

    setupControlEvents(elementId) {
        // Controle de tamanho de fonte
        this.settingsContent.querySelector('.decrease').addEventListener('click', () => 
            this.adjustFontSize(elementId, -2));
        this.settingsContent.querySelector('.increase').addEventListener('click', () => 
            this.adjustFontSize(elementId, 2));
        
        // Controle de cor
        const colorInput = this.settingsContent.querySelector('.color-input');
        const colorHex = this.settingsContent.querySelector('.color-hex');
        
        colorInput.addEventListener('input', (e) => {
            const color = e.target.value;
            colorHex.textContent = color;
            this.updateAdvancedSetting(elementId, 'color', color);
        });
        
        // Controle de posição
        const positionSlider = this.settingsContent.querySelector('.vertical-slider');
        const positionValue = this.settingsContent.querySelector('.position-value');
        
        positionSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            positionValue.textContent = `${value}px`;
            this.updateAdvancedSetting(elementId, 'yOffset', value);
        });
        
        // Controles de estilo de fonte
        this.settingsContent.querySelectorAll('.font-style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const style = e.currentTarget.dataset.style;
                this.setFontStyle(elementId, style);
                
                this.settingsContent.querySelectorAll('.font-style-btn').forEach(b => {
                    b.classList.toggle('active', b === e.currentTarget);
                });
            });
        });
        
        // Botão de reset
        const resetBtn = this.settingsContent.querySelector('.btn-reset-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetElementSettings(elementId));
        }
    }

    getDefaultFontSize(elementId) {
        const template = this.templateManager.getCurrentTemplate();
        const fieldRefMap = {
            'origem': 'origin', 'obsOrigem': 'originObs',
            'destino': 'destination', 'obsDestino': 'destinationObs',
            'valor': 'value', 'obs': 'obs', 'contact': 'contact',
        };
        const el = this.templateManager.getElementByFieldRef(template, fieldRefMap[elementId]);
        return el ? el.fontSize : 40;
    }

    getDefaultColor(elementId) {
        const template = this.templateManager.getCurrentTemplate();
        const fieldRefMap = {
            'origem': 'origin', 'obsOrigem': 'originObs',
            'destino': 'destination', 'obsDestino': 'destinationObs',
            'valor': 'value', 'obs': 'obs', 'contact': 'contact',
        };
        const el = this.templateManager.getElementByFieldRef(template, fieldRefMap[elementId]);
        return el ? (el.color || '#000000') : '#000000';
    }

    adjustFontSize(elementId, delta) {
        const currentEl = this.settingsContent.querySelector(`#fontSize-${elementId}`);
        if (!currentEl) return;
        
        let currentSize = parseInt(currentEl.textContent);
        currentSize = Math.max(12, Math.min(150, currentSize + delta));
        currentEl.textContent = currentSize;
        this.updateAdvancedSetting(elementId, 'fontSize', currentSize);
    }

    setFontStyle(elementId, style) {
        const weightMap = {
            'bold': 'bold',
            'light': 'light',
            'italic': 'italic'
        };
        this.updateAdvancedSetting(elementId, 'fontWeight', weightMap[style]);
    }

    updateAdvancedSetting(elementId, key, value) {
        if (!this.advancedSettings[elementId]) {
            this.advancedSettings[elementId] = {};
        }
        this.advancedSettings[elementId][key] = value;
        this.updateCanvas();
    }

    resetElementSettings(elementId) {
        delete this.advancedSettings[elementId];
        
        // Atualiza controles no painel
        this.createElementControls(elementId);
        this.updateCanvas();
        this.showSuccess(`Configurações de ${elementId} resetadas!`);
    }

    createTemplatePreviews() {
        const container = document.getElementById("templatePreviews");
        if (!container) return;

        container.innerHTML = "";
        const templates = this.templateManager.getAllTemplates();
        
        Object.values(templates).forEach(template => {
            const bg = this.imageLoader.getImage(`bg-${template.id}`);
            
            const previewDiv = document.createElement("div");
            previewDiv.className = `template-preview ${template.id === this.templateManager.currentTemplateId ? 'active' : ''}`;
            previewDiv.dataset.templateId = template.id;
            previewDiv.title = `${template.name}`;
            
            try {
                if (bg) {
                    const thumbCanvas = this.canvasRenderer.generateThumbnail(
                        template, bg, template.previewScale
                    );
                    previewDiv.appendChild(thumbCanvas);
                } else {
                    throw new Error("Imagens não carregadas");
                }
            } catch (error) {
                const placeholder = document.createElement("div");
                placeholder.style.cssText = `
                    width: 100%; height: 100%; 
                    background-color: ${template.mode === 'dark' ? '#333' : '#fff'};
                    display: flex; align-items: center; justify-content: center;
                    color: ${template.mode === 'dark' ? '#fff' : '#333'};
                `;
                placeholder.textContent = template.id;
                previewDiv.appendChild(placeholder);
            }
            
            previewDiv.addEventListener("click", () => this.onTemplateSelect(template.id));
            container.appendChild(previewDiv);
        });
    }

    updateCanvas() {
        try {
            const currentTemplate = this.templateManager.getCurrentTemplate();
            const bg = this.imageLoader.getImage(`bg-${currentTemplate.id}`);
            
            if (!currentTemplate || !bg) {
                this.showError("Aguarde o carregamento das imagens...");
                return;
            }

            const formattedData = {
                origem: this.formData.origem || "ORIGEM",
                obsOrigem: this.formData.obsOrigem || "",
                destino: this.formData.destino || "DESTINO",
                obsDestino: this.formData.obsDestino || "",
                valor: this.formData.valor || "0,00",
                obs: this.formData.obs || "",
                contacts: this.formData.contacts,
                customImage: this.formData.customImage || null,
            };

            this.canvasRenderer.updateData(formattedData);
            
            if (Object.keys(this.advancedSettings).length > 0) {
                this.renderWithAdvancedSettings(currentTemplate, bg, formattedData);
            } else {
                this.canvasRenderer.render(currentTemplate, bg);
            }
        } catch (error) {
            console.error("Erro ao renderizar imagem:", error);
            this.showError("Erro ao renderizar imagem.");
        }
    }

    renderWithAdvancedSettings(template, bg, data) {
        try {
            // Clona os elements para não mutar o template original
            const modifiedElements = JSON.parse(JSON.stringify(template.elements));

            // Mapeamento de elementId do painel → fieldRef nos elements[]
            const fieldRefMap = {
                'origem':         'origin',
                'obsOrigem':      'originObs',
                'destino':        'destination',
                'obsDestino':     'destinationObs',
                'valor':          'value',
                'obs':            'obs',
                'contact':        'contact',
            };

            Object.keys(this.advancedSettings).forEach(elementId => {
                const settings = this.advancedSettings[elementId];
                const fieldRef = fieldRefMap[elementId];
                if (!fieldRef) return;

                // Aplica as mudanças em todos os elements com esse fieldRef
                modifiedElements
                    .filter(el => el.fieldRef === fieldRef)
                    .forEach(el => {
                        if (settings.fontSize)            el.fontSize   = settings.fontSize;
                        if (settings.color)               el.color      = settings.color;
                        if (settings.fontWeight)          el.fontWeight = settings.fontWeight;
                        if (settings.yOffset !== undefined) el.y        = (el.y || 0) + settings.yOffset;
                    });
            });

            const modifiedTemplate = {
                ...template,
                elements: modifiedElements,
                render: (ctx, d, bgImg) => this.templateManager.renderTemplate(ctx, d, bgImg, { ...template, elements: modifiedElements })
            };

            this.canvasRenderer.render(modifiedTemplate, bg);
        } catch (error) {
            console.error("Erro ao renderizar com configurações avançadas:", error);
            this.canvasRenderer.render(template, bg);
        }
    }

    onInputChange(inputId) {
        const element = document.getElementById(inputId);
        if (element) {
            this.formData[inputId] = element.value;
            this.updateCanvas();
        }
    }

    async onTemplateSelect(templateId) {
        try {
            this.showLoading(true, "Carregando template...");
            
            if (this.templateManager.setTemplate(templateId)) {
                const template = this.templateManager.getCurrentTemplate();
                
                document.querySelectorAll(".template-preview").forEach(preview => {
                    const isActive = parseInt(preview.dataset.templateId) === templateId;
                    preview.classList.toggle("active", isActive);
                });
                
                // Fecha painel de configurações se estiver aberto
                this.closeSettingsPanel();
                
                // Reseta configurações avançadas para novo template
                this.advancedSettings = {};
                
                this.updateCanvas();
            }
            
            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            console.error("Erro ao carregar template:", error);
            this.showError("Erro ao carregar template.");
        }
    }

    onDownloadClick() {
        try {
            const origem = this.formData.origem || "origem";
            const destino = this.formData.destino || "destino";
            const templateName = this.templateManager.getCurrentTemplate().name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9\-]/g, '');
            
            const filename = `frete-${origem}-para-${destino}-${templateName}`;
            
            if (Object.keys(this.advancedSettings).length > 0) {
                this.downloadWithAdvancedSettings(filename);
            } else {
                this.canvasRenderer.download(filename);
            }
            
            this.showSuccess("Imagem baixada com sucesso!");
        } catch (error) {
            console.error("Erro ao baixar imagem:", error);
            this.showError("Erro ao baixar imagem.");
        }
    }

    downloadWithAdvancedSettings(filename) {
        try {
            const currentTemplate = this.templateManager.getCurrentTemplate();
            const bg = this.imageLoader.getImage(`bg-${currentTemplate.id}`);
            
            if (!currentTemplate || !bg) {
                throw new Error("Imagens não carregadas");
            }

            const downloadCanvas = document.createElement('canvas');
            downloadCanvas.width = 1080;
            downloadCanvas.height = 1920;
            const downloadCtx = downloadCanvas.getContext('2d');
            
            const formattedData = {
                origem: this.formData.origem || "ORIGEM",
                obsOrigem: this.formData.obsOrigem || "",
                destino: this.formData.destino || "DESTINO",
                obsDestino: this.formData.obsDestino || "",
                valor: this.formData.valor || "0,00",
                obs: this.formData.obs || "",
                contacts: this.formData.contacts,
                customImage: this.formData.customImage || null,
            };

            this.renderWithAdvancedSettings(currentTemplate, bg, formattedData);
            this.canvasRenderer.renderToCanvas(downloadCtx, currentTemplate, bg);
            
            const link = document.createElement("a");
            link.download = `${filename}.png`;
            link.href = downloadCanvas.toDataURL("image/png");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Erro ao baixar com configurações avançadas:", error);
            this.canvasRenderer.download(filename);
        }
    }

    showLoading(show, message = "Carregando...") {
        let loader = document.getElementById('loadingOverlay');
        
        if (show && !loader) {
            loader = document.createElement('div');
            loader.id = 'loadingOverlay';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
                font-family: 'Lufga', Arial, sans-serif;
            `;
            
            loader.innerHTML = `
                <div class="loading-spinner" style="
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #ff003d;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <div class="loading-text" style="margin-top: 20px; font-size: 18px;">${message}</div>
            `;
            
            const style = document.createElement('style');
            style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
            loader.appendChild(style);
            document.body.appendChild(loader);
        } else if (!show && loader) {
            loader.remove();
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const oldNotifications = document.querySelectorAll('.notification');
        oldNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: white;
            font-family: 'Lufga', Arial, sans-serif;
            font-weight: 600;
            z-index: 1001;
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #4CAF50;' : ''}
            ${type === 'error' ? 'background: #ff003d;' : ''}
            ${type === 'info' ? 'background: #2196F3;' : ''}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const app = new App();
    window.app = app;
    console.log("Aplicação carregada com sucesso!");
});