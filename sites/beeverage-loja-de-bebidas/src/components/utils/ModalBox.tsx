import { useNavigate } from 'react-router-dom';
import ButtonIcon from './ButtonIcon';
import './ModalBox.css';

interface IModalBox {
    modelos: IModal[];
}

function ModalBox({modelos}: IModalBox) {
    const navigate = useNavigate();
  return (
    <nav className="Modal">
        { modelos.map((modelo) =>
            <ButtonIcon key={modelo.name} onClick={() => navigate(modelo.src)} className="icons">
                {modelo.icon}{modelo.name}
            </ButtonIcon>
        )}
    </nav>
  )
}

export default ModalBox;