import React from 'react';
import './ButtonIcon.css';

type buttonProps = React.ComponentProps<'button'> & React.PropsWithChildren;

const ButtonIcon = ({children, ...props}: buttonProps) => {
  return (
    <button {...props}>{children}</button>
  )
}

export default ButtonIcon;