import { createContext, useContext, useState } from 'react';

export const WidthScreen = createContext();

export const WidthScreenContext = ({children}) => {
    
    const [width, setWidth] = useState(window.innerWidth);
    const [dateModal, setDateModal] = useState(undefined);

    function resetDateModal() {
        setDateModal(undefined);
    }

    window.addEventListener('resize', () => {
        setWidth(window.innerWidth);
      });

    return (
        <WidthScreen.Provider value={ { width, dateModal, setDateModal, resetDateModal } }>
            {children}
        </WidthScreen.Provider> 
    )
}

export const useWidthScreen = () => useContext(WidthScreen);