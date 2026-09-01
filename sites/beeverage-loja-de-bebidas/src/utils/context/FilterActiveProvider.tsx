import React from 'react';

const FilterContext = React.createContext<FilterPageProps>({} as FilterPageProps);

interface FilterPageProps {
  filterActive: boolean;
  setFilterActive: React.Dispatch<React.SetStateAction<boolean>>;
}

const FilterActiveProvider = ({children}: React.PropsWithChildren) => {
  const [filterActive, setFilterActive] = React.useState<boolean>(false);

  return (
    <FilterContext.Provider value={ {filterActive, setFilterActive}}>
      {children}
    </FilterContext.Provider>
  )
}

export default FilterActiveProvider;

export const useFilterActive = () => React.useContext(FilterContext);