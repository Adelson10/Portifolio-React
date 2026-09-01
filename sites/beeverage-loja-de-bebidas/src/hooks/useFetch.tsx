import React from 'react';

function useFetch<T>(url: string) {
    const [json, setJson] = React.useState<T | null>(null);
    
    React.useEffect(() => {
        const Fetch = async () => {
            try {
                const api = await fetch(`http://localhost:3000${url}`);                
                const json = await api.json() as T;
                
                if(api.ok) {
                    setJson(json);
                } else {
                    throw new Error('Não foi possivel conectar');
                }
            } catch (error) {
                if(error instanceof Error) {
                    console.error(error.message);
                }
            }
        }
        Fetch();
    }, [url]);

    return {json}
}

export default useFetch;