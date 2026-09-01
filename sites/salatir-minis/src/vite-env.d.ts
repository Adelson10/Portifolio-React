interface FactionProps {
    title: string;
    products: PropsModalBox[];
}

interface PropsModalBox {
    image: string[];
    name: string;
    faction: string;
    iconCompany: string;
    statusPosition: string;
    status: {
        m: string;
        t: string;
        sv: string;
        w: string;
        ld: string;
        oc: string;
    };
    tags: string[],
    AvailableActions: AvailableActionsProps[];
    subtitle: string;
    description: string;
    author: string;
    FrontBox: string;
    LeftBox: string;
    RightBox: string;
}

interface AvailableActionsProps {
    cp: string;
    type: string;
    icon: string;
    title: string;
}

interface DistProps {
    finalPosition?: number;
    startX: number;
    movement: number;
    movePosition?: number;
    sideNow: number;
}

declare module '*.css';
declare module "*.webp";
declare module "*.svg";
declare module "*.jpeg";
declare module "*.jpg";
declare module 'swiper/css';
declare module 'swiper/css/pagination';