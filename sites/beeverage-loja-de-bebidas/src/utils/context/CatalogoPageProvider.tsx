import React from 'react';

const CatalogoContext = React.createContext<CatalogoPageProps>({} as CatalogoPageProps);

interface CatalogoPageProps {
  CatalogoPage: boolean;
  setCatalogoPage: React.Dispatch<React.SetStateAction<boolean>>;
}

const CatalogoPageProvider = ({children}: React.PropsWithChildren) => {
  const [CatalogoPage, setCatalogoPage] = React.useState<boolean>(false);

  return (
    <CatalogoContext.Provider value={ {CatalogoPage, setCatalogoPage}}>
      {children}
    </CatalogoContext.Provider>
  )
}

export default CatalogoPageProvider;

export const useCatalogoPage = () => React.useContext(CatalogoContext);