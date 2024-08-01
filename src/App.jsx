import './App.css'
import Header from './components/Header/Header';
import Apresentacao from './components/Apresentacao/Apresentacao';
import { WidthScreenContext } from './hooks/WidthScreen/useWidthScreen';
import Habilidades from './components/Habilidades/Habilidades';
import SobreMim from './components/SobreMim/SobreMim';

function App() {

  return (
    <>
      <WidthScreenContext>
        <Header>
            <Apresentacao />
            <SobreMim />
        </Header>
      </ WidthScreenContext>
    </>
  )
}

export default App;
