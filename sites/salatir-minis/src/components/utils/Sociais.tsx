import { DiscordLogo, InstagramLogo, XLogo } from '@phosphor-icons/react';
import './Sociais.css';

const Sociais = () => {
  return (
    <ul className='Sociais'>
        <li><a href="http://" target="_blank" rel="noopener noreferrer"><DiscordLogo size={'1.2rem'} weight='fill'/></a></li>
        <li><a href="http://" target="_blank" rel="noopener noreferrer"><XLogo size={'1.2rem'} weight='fill'/></a></li>
        <li><a href="http://" target="_blank" rel="noopener noreferrer"><InstagramLogo size={'1.2rem'} /></a></li>
    </ul>
  )
}

export default Sociais;
