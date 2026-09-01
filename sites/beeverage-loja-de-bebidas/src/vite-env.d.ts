/// <reference types="vite/client" />

interface IModal {
    icon: React.ReactElement;
    name: string;
    src: string;
}

interface MenuContainerProps {
    title: string;
    src: string;
    img: string;
    categorias: MenuCategorias[];
}

interface MenuCategorias {
    name: string;
    src: string;
}

interface productModal {
    id: number;
    thumbnail: ImageProductModal;
    imagens: string[];
    score: number;
    name: string;
    volume: string;
    priceNow: number;
    price: number;
    categoria: string;
    meta_description: string;
    filter: string[]
}

interface reviews {
    id: number;
    product: number;
    address: number;
    date: string;
    score: number;
    message : string;
    status: string;
}

type ImageProductModal = {
    src: string;
    shadowWidth: number;
}

interface ModalFilterProducts {
    title: string;
    filters: string[];
}

interface User {
    id: number;
    name: string;
    gender: string;
    dateOfBirth: string;
    cpf: string;
    phone: string;
    email: string;
    senha: string;
    photo: string;
}