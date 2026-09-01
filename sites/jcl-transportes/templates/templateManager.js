/**
 * Gerenciador de Templates — renderização por array de elements[]
 */

// Definições dos templates (convertido de templates.ts)
const TEMPLATE_DEFINITIONS = [
  // ===========================================================================
  // TEMPLATE 1 - MODERNO
  // ===========================================================================
  {
    id: 1,
    name: 'Template Moderno',
    bgImage: './assets/template-1.png',
    previewScale: 0.08,
    elements: [
      { id: 'mod-orig-val', type: 'text', text: 'Araguaína - TO', x: 0, y: 750, width: 1080, height: 150, fontSize: 110, color: '#000000', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Space Grotesk', letterSpacing: -3, lineHeight: 1, fieldRef: 'origin', fontStyle: 'italic' },
      { id: 'mod-orig-obs', type: 'text', text: 'Carrega amanhã', x: 0, y: 920, width: 1080, height: 58, fontSize: 48, color: '#cd1419', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'originObs', fontWeight: 'bold', pushDown: true, collapsible: true },
      { id: 'mod-custom-img', type: 'image', x: 515, y: 990, width: 75, height: 75, fieldRef: 'customImage', pushDown: true },
      { id: 'mod-dest-val', type: 'text', text: 'Palmas - TO', x: 0, y: 1090, width: 1080, height: 130, fontSize: 110, color: '#000000', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Space Grotesk', letterSpacing: -3, lineHeight: 1, fieldRef: 'destination', fontStyle: 'italic', pushDown: true },
      { id: 'mod-dest-obs', type: 'text', text: 'Descarga rápida autorizada', x: 0, y: 1260, width: 1080, height: 58, fontSize: 48, color: '#cd1419', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'destinationObs', fontWeight: 'bold', pushDown: true, collapsible: true },
      { id: 'mod-price-val', type: 'text', text: 'R$ 2.500,00', x: 130, y: 1350, width: 820, height: 130, fontSize: 90, color: '#cd1419', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'value', pushDown: true },
      { id: 'mod-obs', type: 'text', text: '', x: 0, y: 1510, width: 1080, height: 55, fontSize: 36, color: '#000000', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'obs', fontWeight: 'bold', pushDown: true, collapsible: true },
      { id: 'mod-phone-lbl', type: 'text', text: 'Contato:', x: 180, y: 1730, width: 720, height: 40, fontSize: 32, color: '#cd1419', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'contactLabel' },
      { id: 'mod-phone-val', type: 'text', text: '(63) 99999-9999', x: 180, y: 1780, width: 720, height: 120, fontSize: 50, color: '#000000', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Space Grotesk', fieldRef: 'contact' },
    ],
  },

  // ===========================================================================
  // TEMPLATE 2 - DINÂMICO
  // ===========================================================================
  {
    id: 2,
    name: 'Template Dinâmico',
    bgImage: './assets/template-2.png',
    previewScale: 0.08,
    elements: [
      { id: 'emp-orig-val', type: 'text', text: 'Araguaína-TO', x: 0, y: 680, width: 1050, height: 110, fontSize: 110, color: '#ffffff', textAlign: 'center', fontFamily: 'Anton', fieldRef: 'origin', fontStyle: 'italic', lineHeight: 1 },
      { id: 'emp-orig-obs', type: 'text', text: 'Observação: Carregamento', x: 0, y: 795, width: 1080, height: 40, fontSize: 32, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'originObs', pushDown: true, collapsible: true },
      { id: 'x', type: 'text', text: 'X', x: 140, y: 920, width: 800, height: 60, fontSize: 50, color: '#ffffff', textAlign: 'center', fontFamily: 'Montserrat', pushDown: true },
      { id: 'emp-dest-val', type: 'text', text: 'Palmas-TO', x: 0, y: 1060, width: 1050, height: 110, fontSize: 110, color: '#ffffff', textAlign: 'center', fontFamily: 'Anton', fieldRef: 'destination', fontStyle: 'italic', pushDown: true, lineHeight: 1 },
      { id: 'emp-dest-obs', type: 'text', text: 'Observação: Entrega comercial rápida', x: 0, y: 1175, width: 1080, height: 40, fontSize: 32, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'destinationObs', pushDown: true, collapsible: true },
      { id: 'emp-price-val', type: 'text', text: 'R$ 2.500,00', x: 140, y: 1270, fontWeight: 'bold', width: 800, height: 144, fontSize: 120, color: '#ffffff', textAlign: 'center', fontFamily: 'Anton', fieldRef: 'value', letterSpacing: 10, pushDown: true },
      { id: 'emp-obs', type: 'text', text: '', x: 0, y: 1440, width: 1080, height: 55, fontSize: 36, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'obs', fontWeight: 'bold', pushDown: true, collapsible: true },
      { id: 'emp-phone-lbl', type: 'text', text: 'CONTATO:', x: 180, y: 1730, width: 720, height: 40, fontSize: 32, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'contactLabel' },
      { id: 'emp-phone-val', type: 'text', text: '(63) 99999-9999', x: 180, y: 1780, width: 720, height: 120, fontSize: 54, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'contact' },
    ],
  },

  // ===========================================================================
  // TEMPLATE 3 - PREMIUM
  // ===========================================================================
  {
    id: 3,
    name: 'Template Premium',
    bgImage: './assets/template-3.png',
    previewScale: 0.08,
    elements: [
      { id: 'prem-orig-val', type: 'text', text: 'Araguaína-TO', x: 0, y: 469, width: 1080, height: 110, fontSize: 90, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'origin' },
      { id: 'prem-orig-obs', type: 'text', text: 'Local de carregamento: Terminal A', x: 0, y: 580, width: 1080, height: 40, fontSize: 32, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'originObs', pushDown: true, collapsible: true },
      { id: 'prem-arrow', type: 'text', text: '✦ Rota Direta ✦', x: 170, y: 650, width: 740, height: 50, fontSize: 28, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', pushDown: true },
      { id: 'prem-dest-val', type: 'text', text: 'Palmas-TO', x: 0, y: 700, width: 1080, height: 110, fontSize: 90, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'destination', pushDown: true },
      { id: 'prem-dest-obs', type: 'text', text: 'Entrega programada sem filas', x: 0, y: 810, width: 1080, height: 50, fontSize: 32, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'destinationObs', pushDown: true, collapsible: true },
      { id: 'prem-price-val', type: 'text', text: 'R$ 2.500,00', pushDown: true, x: 0, y: 880, width: 1080, height: 160, fontSize: 125, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Rubik', fieldRef: 'value', letterSpacing: -5 },
      { id: 'prem-cargo', type: 'text', text: 'Carga: Grãos', x: 0, y: 1030, width: 1080, height: 70, fontSize: 46, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'cargoType' },
      { id: 'prem-obs', type: 'text', text: '', x: 0, y: 1120, width: 1080, height: 55, fontSize: 36, color: '#ffffff', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'obs', fontWeight: 'bold', collapsible: true },
      { id: 'prem-phone-btn', type: 'text', text: 'CONTATO:', x: 180, y: 1730, width: 720, height: 40, fontSize: 28, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'contactLabel' },
      { id: 'prem-phone-val', type: 'text', text: '(63) 99999-9999', x: 180, y: 1780, width: 720, height: 120, fontSize: 46, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'contact' },
    ],
  },

  // ===========================================================================
  // TEMPLATE 4 - LARANJA / NEON
  // ===========================================================================
  {
    id: 4,
    name: 'Template Laranja / Neon',
    bgImage: './assets/template-4.png',
    previewScale: 0.08,
    elements: [
      { id: 'esc-origin-val', type: 'text', text: 'Araguaína - TO', x: 0, y: 380, width: 1080, height: 140, fontSize: 100, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'origin' },
      { id: 'esc-origin-obs', type: 'text', text: 'OBS: Carrega amanhã cedo', x: 0, y: 508, width: 1080, height: 60, fontSize: 36, color: '#ffffff', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'originObs', fontStyle: 'italic', pushDown: true, collapsible: true },
      { id: 'esc-split', type: 'text', text: '--------------------------------------', x: 140, y: 615, width: 800, height: 40, fontSize: 24, color: '#ffffff', textAlign: 'center', pushDown: true },
      { id: 'esc-dest-val', type: 'text', text: 'Palmas - TO', x: 0, y: 670, width: 1080, height: 140, fontSize: 100, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'destination', pushDown: true },
      { id: 'esc-dest-obs', type: 'text', text: 'OBS: Descarga rápida autorizada', x: 0, y: 810, width: 1080, height: 60, fontSize: 36, color: '#ffffff', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'destinationObs', fontStyle: 'italic', pushDown: true, collapsible: true },
      { id: 'esc-cargo', type: 'text', text: '// CARGA: Grãos', x: 100, y: 915, width: 450, height: 90, fontSize: 48, color: '#ffffff', fontWeight: 'bold', textAlign: 'left', fontFamily: 'Montserrat', fieldRef: 'cargoType' },
      { id: 'esc-weight', type: 'text', text: '// CAPACIDADE: 32 t', x: 570, y: 915, width: 450, height: 90, fontSize: 48, color: '#ffffff', fontWeight: 'bold', textAlign: 'right', fontFamily: 'Montserrat', fieldRef: 'weight' },
      { id: 'esc-price-val', type: 'text', text: 'R$2.500,00', pushDown: true, x: 90, y: 1050, width: 900, height: 160, fontSize: 110, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'value' },
      { id: 'esc-obs', type: 'text', text: '', x: 0, y: 1240, width: 1080, height: 55, fontSize: 36, color: '#ffffff', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'obs', fontWeight: 'bold', collapsible: true },
      { id: 'esc-phone-lbl', type: 'text', text: 'CONTATO:', x: 180, y: 1730, width: 720, height: 40, fontSize: 28, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'contactLabel' },
      { id: 'esc-phone-val', type: 'text', text: '(63) 99999-9999', x: 180, y: 1780, width: 720, height: 120, fontSize: 48, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'contact' },
    ],
  },

  // ===========================================================================
  // TEMPLATE 5 - ESCURO (background5)
  // ===========================================================================
  {
    id: 5,
    name: 'Template Escuro',
    bgImage: './assets/template-5.png',
    previewScale: 0.08,
    elements: [
      { id: 'wa-bubble-orig-lbl', type: 'text', text: 'ORIGEM:', x: 140, y: 315, width: 760, height: 60, fontSize: 32, color: '#ffffff', fontWeight: 'bold', textAlign: 'left', fontFamily: 'Inter' },
      { id: 'wa-bubble-orig-val', type: 'text', text: 'Araguaína-TO', x: 0, y: 355, width: 1080, height: 125, fontSize: 90, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'origin', letterSpacing: -5 },
      { id: 'wa-bubble-orig-obs', type: 'text', text: 'Obs: Carrega amanhã cedo', x: 0, y: 475, width: 1080, height: 40, fontSize: 32, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'originObs', fontWeight: 'bold', pushDown: true, collapsible: true },
      { id: 'wa-bubble-dest-lbl', type: 'text', text: 'DESTINO:', x: 140, y: 700, width: 760, height: 60, fontSize: 32, color: '#ffffff', fontWeight: 'bold', textAlign: 'left', fontFamily: 'Inter', pushDown: true },
      { id: 'wa-bubble-dest-val', type: 'text', text: 'Palmas - TO', x: 0, y: 740, width: 1080, height: 125, fontSize: 90, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'destination', pushDown: true },
      { id: 'wa-bubble-dest-obs', type: 'text', text: 'Obs: Descarga rápida autorizada', x: 0, y: 860, width: 1080, height: 40, fontSize: 32, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'destinationObs', fontWeight: 'bold', pushDown: true, collapsible: true },
      { id: 'wa-spec-cargo', type: 'text', text: '📦 Grãos (Soja) • ⚖️ 32 T', x: 140, y: 960, width: 800, height: 100, fontSize: 54, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'cargoType' },
      { id: 'wa-price-lbl', type: 'text', text: 'VALOR DO FRETE', x: 160, y: 1180, width: 760, height: 40, fontSize: 28, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter' },
      { id: 'wa-price-val', type: 'text', text: 'R$ 2.500,00', x: 160, y: 1200, width: 760, height: 135, fontSize: 110, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'value', letterSpacing: -8 },
      { id: 'wa-obs', type: 'text', text: '', x: 0, y: 1360, width: 1080, height: 55, fontSize: 36, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'obs', fontWeight: 'bold', collapsible: true },
      { id: 'wa-btn-lbl', type: 'text', text: 'CONTATO:', x: 180, y: 1730, width: 720, height: 40, fontSize: 28, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'contactLabel' },
      { id: 'wa-btn-val', type: 'text', text: '(63) 99999-9999', x: 180, y: 1780, width: 720, height: 120, fontSize: 40, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'contact' },
    ],
  },

  // ===========================================================================
  // TEMPLATE 6 - ESCURO 2 (background7)
  // ===========================================================================
  {
    id: 6,
    name: 'Template Escuro 2',
    bgImage: './assets/template-6.png',
    previewScale: 0.08,
    elements: [
      { id: 'agro2-orig-lbl', type: 'text', text: 'ORIGEM', x: 0, y: 640, width: 1080, height: 40, fontSize: 32, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat' },
      { id: 'agro2-orig-val', type: 'text', text: 'Araguaína - TO', x: 0, y: 680, width: 1080, height: 140, fontSize: 90, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'origin' },
      { id: 'agro2-orig-obs', type: 'text', text: 'Carrega amanhã cedo • Expedição imediata', x: 0, y: 820, width: 1080, height: 60, fontSize: 32, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'originObs', fontWeight: 'bold', pushDown: true, collapsible: true },
      { id: 'agro2-line', type: 'badge', text: '', x: 160, y: 920, width: 760, height: 3, backgroundColor: '#ffffff', pushDown: true },
      { id: 'agro2-dest-lbl', type: 'text', text: 'DESTINO', x: 0, y: 1000, width: 1080, height: 40, fontSize: 32, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', pushDown: true },
      { id: 'agro2-dest-val', type: 'text', text: 'Palmas - TO', x: 0, y: 1040, width: 1080, height: 140, fontSize: 90, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'destination', pushDown: true },
      { id: 'agro2-dest-obs', type: 'text', text: 'Descarga rápida autorizada', x: 0, y: 1180, width: 1080, height: 60, fontSize: 32, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'destinationObs', fontWeight: 'bold', pushDown: true, collapsible: true },
      { id: 'agro2-price-val', type: 'text', text: 'R$ 2.500,00', x: 0, y: 1510, width: 1080, height: 120, fontSize: 115, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'value' },
      { id: 'agro2-obs', type: 'text', text: '', x: 0, y: 1645, width: 1080, height: 55, fontSize: 34, color: '#ffffff', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'obs', fontWeight: 'bold', collapsible: true },
      { id: 'agro2-phone-lbl', type: 'text', text: 'CONTATO:', x: 180, y: 1730, width: 720, height: 40, fontSize: 28, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'contactLabel' },
      { id: 'agro2-phone-val', type: 'text', text: '(63) 99999-9999', x: 180, y: 1780, width: 720, height: 120, fontSize: 40, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'contact' },
    ],
  },

  // ===========================================================================
  // TEMPLATE 7 - AGRO
  // ===========================================================================
  {
    id: 7,
    name: 'Template Agro',
    bgImage: './assets/template-7.png',
    previewScale: 0.08,
    elements: [
      { id: 'agro-orig-lbl', type: 'text', text: 'ORIGEM', x: 0, y: 640, width: 1080, height: 40, fontSize: 32, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat' },
      { id: 'agro-orig-val', type: 'text', text: 'Araguaína - TO', x: 0, y: 680, width: 1080, height: 140, fontSize: 90, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'origin' },
      { id: 'agro-orig-obs', type: 'text', text: 'Carrega amanhã cedo • Expedição imediata', x: 0, y: 820, width: 1080, height: 60, fontSize: 32, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'originObs', fontWeight: 'bold', pushDown: true, collapsible: true },
      { id: 'agro-dest-lbl', type: 'text', text: 'DESTINO', x: 0, y: 1000, width: 1080, height: 40, fontSize: 32, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', pushDown: true },
      { id: 'agro-dest-val', type: 'text', text: 'Palmas - TO', x: 0, y: 1040, width: 1080, height: 140, fontSize: 90, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'destination', pushDown: true },
      { id: 'agro-dest-obs', type: 'text', text: 'Descarga rápida autorizada', x: 0, y: 1180, width: 1080, height: 60, fontSize: 32, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'destinationObs', fontWeight: 'bold', pushDown: true, collapsible: true },
      { id: 'agro-price-val', type: 'text', text: 'R$ 2.500,00', x: 0, y: 1500, width: 1080, height: 120, fontSize: 115, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'value' },
      { id: 'agro-obs', type: 'text', text: '', x: 0, y: 1635, width: 1080, height: 55, fontSize: 34, color: '#ffffff', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'obs', fontWeight: 'bold', collapsible: true },
      { id: 'agro-phone-lbl', type: 'text', text: 'CONTATO:', x: 180, y: 1730, width: 720, height: 40, fontSize: 28, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'contactLabel' },
      { id: 'agro-phone-val', type: 'text', text: '(63) 99999-9999', x: 180, y: 1780, width: 720, height: 120, fontSize: 40, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Montserrat', fieldRef: 'contact' },
    ],
  },

  // ===========================================================================
  // TEMPLATE 8 - GRÃOS
  // ===========================================================================
  {
    id: 8,
    name: 'Template Grãos',
    bgImage: './assets/template-8.png',
    previewScale: 0.08,
    elements: [
      { id: 'graos-orig-val', type: 'text', text: 'Araguaína - TO', x: 154, y: 870, width: 345, height: 90, fontSize: 36, color: '#ffffff', textAlign: 'left', fontFamily: 'Anton', fieldRef: 'origin', lineHeight: 1 },
      { id: 'graos-dest-val', type: 'text', text: 'Palmas - TO', x: 156, y: 1010, width: 288, height: 85, fontSize: 36, color: '#ffffff', textAlign: 'left', fontFamily: 'Anton', fieldRef: 'destination', lineHeight: 1 },
      { id: 'graos-price-val', type: 'text', text: 'R$ 2.500,00', x: 145, y: 1140, width: 328, height: 74, fontSize: 55, color: '#ffffff', fontWeight: 'bold', textAlign: 'left', fontFamily: 'Anton', fieldRef: 'value', fontStyle: 'italic', letterSpacing: 3 },
      { id: 'graos-orig-obs', type: 'text', text: 'Carrega amanhã cedo • Expedição imediata', x: 230, y: 1490, width: 360, height: 60, fontSize: 55, color: '#ffffff', textAlign: 'left', fontFamily: 'Inter', fieldRef: 'originObs', fontWeight: 'bold' },
      { id: 'graos-obs', type: 'text', text: '', x: 0, y: 1600, width: 1080, height: 55, fontSize: 34, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'obs', fontWeight: 'bold', collapsible: true },
      { id: 'graos-phone-lbl', type: 'text', text: 'CONTATO:', x: 180, y: 1730, width: 720, height: 40, fontSize: 28, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'contactLabel' },
      { id: 'graos-phone-val', type: 'text', text: '(63) 99999-9999', x: 180, y: 1780, width: 720, height: 120, fontSize: 40, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', fieldRef: 'contact' },
    ],
  },
];

// =============================================================================
// Classe TemplateManager
// =============================================================================
class TemplateManager {
    constructor() {
        this.templates = {};

        TEMPLATE_DEFINITIONS.forEach(def => {
            const tpl = { ...def };
            tpl.render = (ctx, data, bgImage) => this.renderTemplate(ctx, data, bgImage, tpl);
            this.templates[tpl.id] = tpl;
        });

        this.currentTemplateId = 1;
        this.currentTemplate = this.templates[1];
    }

    setTemplate(templateId) {
        if (this.templates[templateId]) {
            this.currentTemplateId = templateId;
            this.currentTemplate = this.templates[templateId];
            return true;
        }
        return false;
    }

    getCurrentTemplate() {
        return this.currentTemplate;
    }

    getAllTemplates() {
        return this.templates;
    }

    // -------------------------------------------------------------------------
    // Renderização principal (aceita template opcional para advanced settings)
    // -------------------------------------------------------------------------
    renderTemplate(ctx, data, bgImage, template) {
        const tpl = template || this.currentTemplate;
        const canvas = ctx.canvas;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        }

        // yOffset é bidirecional:
        //   • collapsible + vazio  → yOffset -= height  (elementos sobem)
        //   • overflow de texto    → yOffset += excesso (elementos descem)
        // Apenas elementos com pushDown:true consomem o offset.
        let yOffset = 0;

        for (const el of tpl.elements) {
            const text = this._resolveText(el, data);
            const elY = el.pushDown ? el.y + yOffset : el.y;

            const renderedH = this._renderElement(ctx, el, text, elY, data);

            const expectedH = el.height || (el.fontSize * 1.2);
            if (el.collapsible && !text) {
                // Campo opcional vazio: libera o espaço reservado
                yOffset -= expectedH;
            } else if (renderedH > expectedH) {
                // Texto transbordou: empurra os próximos para baixo
                yOffset += renderedH - expectedH;
            }
        }
    }

    // -------------------------------------------------------------------------
    // Resolve fieldRef para o texto real a partir dos dados do formulário
    // -------------------------------------------------------------------------
    _resolveText(el, data) {
        if (!el.fieldRef) return el.text || '';
        if (el.fieldRef === 'customImage') return '';

        const contactText = Array.isArray(data.contacts)
            ? data.contacts.filter(c => c && c.trim()).join('\n')
            : (data.contact || '');

        const fieldMap = {
            origin:         data.origem      || '',
            destination:    data.destino     || '',
            value:          data.valor       || '',
            originObs:      data.obsOrigem   || '',
            destinationObs: data.obsDestino  || '',
            obs:            data.obs         || '',
            cargoType:      '',
            weight:         '',
            contact:        contactText,
            contactLabel:   data.contactLabel || el.text || '',
            header:         data.header      || el.text || '',
        };

        return fieldMap[el.fieldRef] !== undefined ? fieldMap[el.fieldRef] : (el.text || '');
    }

    // -------------------------------------------------------------------------
    // Despacha para o renderizador correto por tipo
    // -------------------------------------------------------------------------
    _renderElement(ctx, el, text, y, data) {
        switch (el.type) {
            case 'image':
                return this._renderImage(ctx, el, y, data);
            case 'badge':
                return this._renderBadge(ctx, el, text, y);
            case 'text-badge':
                return this._renderTextBadge(ctx, el, text, y);
            default:
                return this._renderText(ctx, el, text, y);
        }
    }

    _renderImage(ctx, el, y, data) {
        const img = data && data[el.fieldRef];
        if (!img || !(img instanceof HTMLImageElement) || !img.complete || !img.naturalWidth) {
            return el.height || 0;
        }
        ctx.save();
        ctx.drawImage(img, el.x, y, el.width, el.height);
        ctx.restore();
        return el.height;
    }

    // -------------------------------------------------------------------------
    // Monta a string CSS de fonte
    // -------------------------------------------------------------------------
    _buildFont(el, fontSize) {
        const style  = el.fontStyle  === 'italic' ? 'italic' : 'normal';
        const weight = el.fontWeight || 'normal';
        const family = el.fontFamily || 'Inter';
        return `${style} ${weight} ${fontSize}px '${family}', Arial, sans-serif`;
    }

    // -------------------------------------------------------------------------
    // Renderiza elemento tipo 'text'
    // Retorna a altura real consumida (para o pushDown calcular corretamente)
    // -------------------------------------------------------------------------
    _renderText(ctx, el, text, y) {
        if (!text) return el.height || (el.fontSize * 1.4);

        ctx.save();

        const fontSize = el.fontSize || 40;
        ctx.font = this._buildFont(el, fontSize);
        ctx.fillStyle = el.color || '#000000';
        ctx.textAlign = el.textAlign || 'left';

        if (el.letterSpacing !== undefined) {
            ctx.letterSpacing = `${el.letterSpacing}px`;
        }

        const lineH = fontSize * (el.lineHeight || 1.2);
        const baseline = y + fontSize * 0.85;

        let textX = el.x;
        switch (el.textAlign) {
            case 'center': textX = el.x + (el.width || 0) / 2; break;
            case 'right':  textX = el.x + (el.width || 0);      break;
        }

        const maxW = el.width || ctx.canvas.width;
        const segments = text.split('\n');
        const allLines = [];
        for (const seg of segments) {
            if (ctx.measureText(seg).width > maxW) {
                allLines.push(...this._wrapText(ctx, seg, maxW));
            } else {
                allLines.push(seg);
            }
        }

        allLines.forEach((line, i) => {
            ctx.fillText(line, textX, baseline + i * lineH);
        });
        ctx.restore();
        return allLines.length * lineH;
    }

    // -------------------------------------------------------------------------
    // Renderiza elemento tipo 'badge' (retângulo colorido, com texto opcional)
    // -------------------------------------------------------------------------
    _renderBadge(ctx, el, text, y) {
        ctx.save();
        ctx.fillStyle = el.backgroundColor || '#000000';
        this._roundRect(ctx, el.x, y, el.width, el.height, el.borderRadius || 0);
        ctx.fill();

        if (text) {
            ctx.font = this._buildFont(el, el.fontSize || 40);
            ctx.fillStyle = el.color || '#ffffff';
            ctx.textAlign = el.textAlign || 'center';
            if (el.letterSpacing !== undefined) ctx.letterSpacing = `${el.letterSpacing}px`;

            const textX = el.textAlign === 'center'
                ? el.x + el.width / 2
                : el.textAlign === 'right'
                    ? el.x + el.width - 10
                    : el.x + 10;
            const textY = y + el.height / 2 + (el.fontSize || 40) * 0.35;
            ctx.fillText(text, textX, textY);
        }

        ctx.restore();
        return el.height;
    }

    // -------------------------------------------------------------------------
    // Renderiza elemento tipo 'text-badge' (badge com borda opcional)
    // -------------------------------------------------------------------------
    _renderTextBadge(ctx, el, text, y) {
        ctx.save();

        ctx.fillStyle = el.backgroundColor || '#000000';
        this._roundRect(ctx, el.x, y, el.width, el.height, el.borderRadius || 0);
        ctx.fill();

        if (el.borderColor) {
            ctx.strokeStyle = el.borderColor;
            ctx.lineWidth   = el.borderWidth || 2;
            this._roundRect(ctx, el.x, y, el.width, el.height, el.borderRadius || 0);
            ctx.stroke();
        }

        if (text) {
            ctx.font = this._buildFont(el, el.fontSize || 40);
            ctx.fillStyle = el.color || '#ffffff';
            ctx.textAlign = el.textAlign || 'center';
            if (el.letterSpacing !== undefined) ctx.letterSpacing = `${el.letterSpacing}px`;

            const textX = el.textAlign === 'center'
                ? el.x + el.width / 2
                : el.textAlign === 'right'
                    ? el.x + el.width - 10
                    : el.x + 10;
            const textY = y + el.height / 2 + (el.fontSize || 40) * 0.35;
            ctx.fillText(text, textX, textY);
        }

        ctx.restore();
        return el.height;
    }

    // -------------------------------------------------------------------------
    // Quebra texto em linhas para caber na largura máxima
    // -------------------------------------------------------------------------
    _wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let current = '';

        for (const word of words) {
            const test = current ? `${current} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    // -------------------------------------------------------------------------
    // Desenha retângulo com bordas arredondadas
    // -------------------------------------------------------------------------
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y,         x + r, y);
        ctx.closePath();
    }

    // -------------------------------------------------------------------------
    // Helpers usados pelo app.js para configurações avançadas
    // -------------------------------------------------------------------------
    getElementByFieldRef(template, fieldRef) {
        return (template.elements || []).find(el => el.fieldRef === fieldRef) || null;
    }
}

const templateManager = new TemplateManager();