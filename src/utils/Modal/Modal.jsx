import { useWidthScreen } from '../../hooks/WidthScreen/useWidthScreen';
import { Link } from 'react-router-dom';
import { BsGithub,BsBoxArrowRight,BsX } from "react-icons/bs";
import { MotionRevealDownModal } from '../Motion/MotionReveal';
import './Modal.css';

const Modal = () => {
  const { dateModal, resetDateModal } = useWidthScreen();

  function handleClick() {
    document.querySelector('body').style.overflowY = 'scroll';
    resetDateModal();
  }

  function handleCloseOut(e) {
    if (e.target.className==='Modal__Background'){
      document.querySelector('body').style.overflowY = 'scroll';
      resetDateModal();
    }
  }
  
  if (dateModal) return (
      <div className='Modal__Background' onClick={handleCloseOut} >
            <button className='close' onClick={handleClick}><BsX /></button>
            <MotionRevealDownModal>
            <div className="Container_Modal">
                <img src={dateModal.image} alt="" />
                <div className="dateModal">
                    <h2>{dateModal.title}</h2>
                    <h3>{dateModal.tecProjeto}</h3>
                    <div>{dateModal.descProjeto}</div>
                    <div>
                        <p className='Title_dateModal'>Link do Projetos<span>.</span></p>
                        <div className='botoes_Modal'>
                            <Link to={dateModal.GitHub} target='_blank' rel='nofollow'><BsGithub />Codigo Fonte</Link>
                            <Link to={dateModal.Href} target='_blank' rel='nofollow'><BsBoxArrowRight />Projeto</Link>
                        </div>
                    </div>
                </div>
            </div>
            </MotionRevealDownModal>
      </div>
  )
}

export default Modal;