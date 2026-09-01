import React from 'react';
import './Button.css';

type buttonProps = React.ComponentProps<'button'> & React.PropsWithChildren;

const Button = ({children, ...props}: buttonProps) => {
  return (
    <button className='button' {...props}>{children}</button>
  )
}

export default Button;
