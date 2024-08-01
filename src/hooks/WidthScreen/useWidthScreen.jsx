import { createContext, useContext, useState } from 'react';

export const WidthScreen = createContext();

export const WidthScreenContext = ({children}) => {
    
    const [width, setWidth] = useState(window.innerWidth);

    window.addEventListener('resize', () => {
        setWidth(window.innerWidth);
      });

    return (
        <WidthScreen.Provider value={ { width } }>
            {children}
        </WidthScreen.Provider> 
    )
}

export const useWidthScreen = () => useContext(WidthScreen);