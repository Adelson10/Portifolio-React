import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Home from './Pages/Home/Home';
import FaleConosco from './Pages/PagesInfo/FaleConosco';
import Termos from './Pages/PagesInfo/Termos';

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />}/>
          <Route path='/FAQ' element={<FaleConosco />}/>
          <Route path='/Termos' element={<Termos />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;
