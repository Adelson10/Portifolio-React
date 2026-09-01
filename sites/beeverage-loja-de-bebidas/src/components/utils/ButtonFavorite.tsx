import { Heart } from '@phosphor-icons/react';

const ButtonFavorite = ({favorite}: {favorite: boolean}) => {
    
  return (
    <button className='ButtonFavorite'>
        { favorite ?
            <Heart fill='fill'/>
            :
            <Heart fill='light'/>
        }
    </button>
  )
}

export default ButtonFavorite