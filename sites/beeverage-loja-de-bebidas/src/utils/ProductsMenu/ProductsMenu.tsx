import Cerveja from '../../assets/imagens/Menu/cervejas.png';
import Vinhos from '../../assets/imagens/Menu/vinho.png';
import Deslitados from '../../assets/imagens/Menu/vodka.png';
import Espumante from '../../assets/imagens/Menu/espumante.png';
import Gin from '../../assets/imagens/Menu/gin.png';
import Petiscos from '../../assets/imagens/Menu/petiscos.png';
import { BeerStein, Martini, BeerBottle, Champagne, Brandy, ForkKnife } from '@phosphor-icons/react';

export const sizeIcon = '1.3rem';

export const MenuProps: MenuContainerProps[]  = [
    {
        title: 'Cervejas',
        src: '/catalogo/cervejas',
        img: Cerveja,
        categorias: [
            {
                name: 'Lager',
                src: '/catalogo/cervejas/lager',
            },
            {
                name: 'Long',
                src: '/catalogo/cervejas/long',
            },
            {
                name: 'Pilsen',
                src: '/catalogo/cervejas/pilsen',
            },
            {
                name: 'IPA (India Pale Ale)',
                src: '/catalogo/cervejas/ipa',
            },
        ]
    },
    {
        title: 'Vinhos',
        src: '/catalogo/vinhos',
        img: Vinhos,
        categorias: [
            {
                name: 'Vinhos Tintos',
                src: '/catalogo/vinhos/vinhosTintos',
            },
            {
                name: 'Vinhos Brancos',
                src: '/catalogo/vinhos/vinhosBrancos',
            },
            {
                name: 'Vinhos Rosés',
                src: '/catalogo/vinhos/vinhosRoses',
            },
            {
                name: 'Vinhos de Sobremesa',
                src: '/catalogo/vinhos/vinhosDeSobremesa',
            },
            {
                name: 'Vinhos Espumantes',
                src: '/catalogo/vinhos/vinhosEspumantes',
            },
        ]
    },
    {
        title: 'Destilados',
        src: '/catalogo/destilados',
        img: Deslitados,
        categorias: [
            {
                name: 'Uísque',
                src: '/catalogo/destilados/uisque',
            },
            {
                name: 'Vodka',
                src: '/catalogo/destilados/vodka',
            },
            {
                name: 'Rum',
                src: '/catalogo/destilados/rum',
            },
            {
                name: 'Tequila e Mezcal',
                src: '/catalogo/destilados/tequilaMezcal',
            },
            {
                name: 'Cachaça',
                src: '/catalogo/destilados/cachaca',
            },
        ]
    },
    {
        title: 'Espumantes',
        src: '/catalogo/espumantes',
        img: Espumante,
        categorias: [
            {
                name: 'Champagne',
                src: '/catalogo/espumantes/champagne',
            },
            {
                name: 'Prosecco',
                src: '/catalogo/espumantes/prosecco',
            },
            {
                name: 'Cava',
                src: '/catalogo/espumantes/cava',
            },
            {
                name: 'Espumante Brasileiro',
                src: '/catalogo/espumantes/espumanteBrasileiro',
            },
        ]
    },
    {
        title: 'Gin',
        src: '/catalogo/gin',
        img: Gin,
        categorias: [
            {
                name: 'London Dry Gin',
                src: '/catalogo/gin/londonDryGin',
            },
            {
                name: 'Gin Floral',
                src: '/catalogo/gin/ginFloral',
            },
            {
                name: 'Gin Saborizado',
                src: '/catalogo/gin/ginSaborizado',
            },
            {
                name: 'Gin Old Tom',
                src: '/catalogo/gin/ginOldTom',
            },
            {
                name: 'Gin Navy Strength',
                src: '/catalogo/gin/ginNavyStrength',
            },
            {
                name: 'Gin Artesanal',
                src: '/catalogo/gin/ginArtesanal',
            },
        ]
    },
    {
        title: 'Petiscos',
        src: '/catalogo/petiscos',
        img: Petiscos,
        categorias: [
            {
                name: 'Frios e Queijos',
                src: '/catalogo/petiscos/friosQueijos',
            },
            {
                name: 'Petiscos de Boteco',
                src: '/catalogo/petiscos/petiscosDeBoteco',
            },
            {
                name: 'Carnes e Grelhados',
                src: '/catalogo/petiscos/carnesGrelhados',
            },
            {
                name: 'Frutos do Mar',
                src: '/catalogo/petiscos/frutosDoMar',
            },
            {
                name: 'Vegetarianos',
                src: '/catalogo/petiscos/vegetarianos',
            },
            {
                name: 'Snacks Rápidos',
                src: '/catalogo/petiscos/snacksRápidos',
            },
        ]
    },
];

interface IQuickAcess {
    icon: React.ReactElement;
    name: string;
    src: string;
}

export const QuickAcess: IQuickAcess[] = [
    {
        icon: <BeerStein size={sizeIcon}/>,
        name: 'Cervejas',
        src: '/catalogo/cervejas'
    },
    {
        icon: <Martini size={sizeIcon}/>,
        name: 'Vinhos',
        src: '/catalogo/vinhos'
    },
    {
        icon: <BeerBottle size={sizeIcon}/>,
        name: 'Destilados',
        src: '/catalogo/destilados'
    },
    {
        icon: <Champagne size={sizeIcon}/>,
        name: 'Espumantes',
        src: '/catalogo/espumantes'
    },
    {
        icon: <Brandy size={sizeIcon}/>,
        name: 'Gin',
        src: '/catalogo/gin'
    },
    {
        icon: <ForkKnife size={sizeIcon}/>,
        name: 'Petiscos',
        src: '/catalogo/petiscos'
    },
]