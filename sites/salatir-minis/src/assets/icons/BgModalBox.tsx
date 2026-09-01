const BgModalBox = ({value, status, children} : React.PropsWithChildren<{value: string, status: string}>) => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.75 36.5V0.5H36.75V21.5229L21.3618 36.5H0.75Z" fill="#00C5D3" stroke="#9AF8FF"/>
    
    <g  transform="translate(8, 7)">
      {children}
    </g>
    <text x="50%" y="26" fontWeight='700' textAnchor="middle" fill="#000D0F" fontSize="22" fontFamily="Inter">
      {value}
    </text>
    <text x="85%" y="37" textAnchor="middle" fill="#9AF8FF" fontSize="8" fontFamily="Inter">
      {status}
    </text>
  </svg>
);

export default BgModalBox;