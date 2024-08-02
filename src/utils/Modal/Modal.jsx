import React from 'react'
import { useWidthScreen } from '../../hooks/WidthScreen/useWidthScreen';
import { Link } from 'react-router-dom';
import { BsGithub,BsBoxArrowRight,BsX } from "react-icons/bs";
import './Modal.css';

const Modal = () => {
  const { dateModal, resetDateModal } = useWidthScreen();
  
  if (dateModal) return (
    <div className='Modal__Background' onClick={resetDateModal}>
            <button className='close' onClick={resetDateModal}><BsX /></button>
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
    </div>
  )
}

export default Modal;