import './App.css'
import Header from './components/Header/Header';
import Apresentacao from './components/Apresentacao/Apresentacao';
import { WidthScreenContext } from './hooks/WidthScreen/useWidthScreen';
import Habilidades from './components/Habilidades/Habilidades';
import SobreMim from './components/SobreMim/SobreMim';
import { BrowserRouter } from 'react-router-dom';

function App() {

  return (
    <>
      <BrowserRouter>
        <WidthScreenContext>
          <Header>
              <Apresentacao />
              <SobreMim />
          </Header>
        </ WidthScreenContext>
      </BrowserRouter>
    </>
  )
}

export default App;
