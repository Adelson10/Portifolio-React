import Catalogo from "../Pages/Catalogo";
import Home from "../Pages/Home";
import { Routes, Route } from 'react-router-dom';
import Produto from "../Pages/Produto";

const Router = () => {
  return (
    <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/catalogo/:catalogo'element={<Catalogo />}/>
        <Route path='/produto/:catalogo/:id/:produto'element={<Produto />}/>
        <Route path='/carrinho' element={<Home />}/>
    </Routes>
  )
}

export default Router;