import React from 'react';
import './Button.css';

const Button = ({href,children,icon}) => {
  return (
    <a className="Button" href={href} target="_blank">{children}  {icon}</a>
  )
}

export default Button;