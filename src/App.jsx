import './App.css'
import Header from './components/Header/Header';
import Apresentacao from './components/Apresentacao/Apresentacao';
import { WidthScreenContext } from './hooks/WidthScreen/useWidthScreen';
import SobreMim from './components/SobreMim/SobreMim';
import { BrowserRouter } from 'react-router-dom';
import Projetos from './components/Projetos/Projetos';
import Modal from './utils/Modal/Modal';

function App() {

  return (
    <>
        <BrowserRouter>
          <WidthScreenContext>
            <div>
              <Header>
                  <Apresentacao />
                  <SobreMim />
                  <Projetos />
              </Header>
            </div>
            <Modal />
          </WidthScreenContext>
        </BrowserRouter>
    </>
  )
}

export default App;
