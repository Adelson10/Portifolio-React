import Header from './components/Header/Header';
import Apresentacao from './components/Apresentacao/Apresentacao';
import { WidthScreenContext } from './hooks/WidthScreen/useWidthScreen';
import SobreMim from './components/SobreMim/SobreMim';
import { BrowserRouter } from 'react-router-dom';
import Projetos from './components/Projetos/Projetos';
import Modal from './utils/Modal/Modal';
import Experiencia from './components/Experiencia/Experiencia';
import Contato from './components/Contato/Contato';
import Footer from './components/Footer/Footer.jsx';

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
                  <Experiencia />
                  <Contato />
                  <Footer />
              </Header>
            </div>
            <Modal />
          </WidthScreenContext>
        </BrowserRouter>
    </>
  )
}

export default App;
