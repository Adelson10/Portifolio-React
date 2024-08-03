import React from 'react';
import './BoxProjetos.css';
import { Link } from 'react-router-dom';
import { BsGithub,BsBoxArrowRight } from "react-icons/bs";
import { useWidthScreen } from '../../hooks/WidthScreen/useWidthScreen';

const BoxProjetos = (props) => {
  const { setDateModal } = useWidthScreen();

  function handleClick() {
    document.querySelector('body').style.overflowY = 'hidden';
    setDateModal(props);
  }
  
  return (
    <div className='containerProjeto'>
        <div className='BoxProjeto'>
            <img src={props.image} alt='Projeto' onClick={handleClick}/>
        </div>
        <div className='BoxDescProjeto'>
            <div className='TitleProjeto'>
                <h2>{props.title}</h2>
                <div className="line"></div>
                <div className="botoes">
                    <Link to={props.GitHub} target='_blank' rel='nofollow'><BsGithub /></Link>
                    <Link to={props.Href} target='_blank' rel='nofollow'><BsBoxArrowRight /></Link>
                </div>
            </div>
            <h3 className="TecProjeto">{props.tecProjeto}</h3>
            <p className="descProjeto">{props.prevProjeto} <span onClick={handleClick}>Leia mais &gt;</span></p>
        </div>
    </div>
  )
}

export default BoxProjetos;