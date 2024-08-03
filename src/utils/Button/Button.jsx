import React from 'react';
import './Button.css';

const Button = ({href,children,icon,Iconizado}) => {
  
  return (
    <a className={`Button ${ Iconizado ? Iconizado : ''}`} href={href} target="_blank">{children}  {icon}</a>
  )
}

export default Button;