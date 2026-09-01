import { CaretDown } from "@phosphor-icons/react";
import './ModalFilterProducts.css'
import { useSearchParams } from "react-router-dom";
import React, { ChangeEvent } from "react";

const ModalFilterProducts = ({title, filters}: ModalFilterProducts) => {
    const key = 'filter';
    const [animation, setAnimation] = React.useState<boolean>(false);
    
    const [filter, setFilter] = useSearchParams();

    function handleChange(event: ChangeEvent) {
        const value = event.currentTarget.id;

        setFilter((filter) => {
            let values = filter.get(key)?.split(",");
            
            if(values) {

                if(values.includes(value)) {
                    values = values.filter((valueNow) => valueNow !== value);
                } else {
                    values.push(value)
                }
                
                if (values.length) {                    
                    filter.set(key, values.toString());
                } else {
                    filter.delete(key);
                }
                
            } else {
                filter.set(key, [value].toString());
            }            

            return filter;
        });
    }

    function isChecked(id: string): boolean {
        const verific = filter.get(key)?.split(',');
         
        if(verific) {
            const listFilter = verific.includes(id);
            return listFilter;
        }
        else return false;
    }

  return (
    <div className='modal-filter-products-container'>
        <div className="modal-filter-products-title-container">
            <h1 className="modal-filter-products-title">{title}</h1>
            <button className={`modal-filter-products-title-close ${animation ? 'reverse' : ''}`}
            onClick={() => setAnimation((n) => !n)}>
                <CaretDown weight="fill" size='1.2rem'/>
            </button>
        </div>
            <div className={`modal-filter-products-filter-container ${ animation ? 'hidden' : ''}`}>
                {filters.map((name) => 
                    <label key={name} className="modal-filter-products-filter" htmlFor={name}>
                        <input type="checkbox" onChange={handleChange} id={name} checked={isChecked(name)}/>
                        {name}
                    </label>
                )}
        </div>
    </div>
  )
}

export default ModalFilterProducts;