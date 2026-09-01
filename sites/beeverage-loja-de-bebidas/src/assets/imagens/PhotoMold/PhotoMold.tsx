import React from "react";

type PhotoMoldProps = React.PropsWithChildren<{
    color1: string,
    color2: string,
    height: string;
    width: string;
}>

function PhotoMold({color1, color2, height, width ,children}: PhotoMoldProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      viewBox="0 0 124 114"
    >
        {children}
      <path
        fill="url(#paint0_radial_723_51)"
        d="M107.968 113.375H16.109c-9.792 0-17.287-8.717-15.819-18.399l12.284-81A16 16 0 0128.394.375h67.631a15.999 15.999 0 0115.829 13.666l11.943 81c1.424 9.661-6.063 18.334-15.829 18.334z"
      ></path>
      <defs>
        <radialGradient
          id="paint0_radial_723_51"
          cx="0"
          cy="0"
          r="1"
          gradientTransform="matrix(0 56.5 -64.5 0 62 56.875)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={color1}></stop>
          <stop offset="1" stopColor={color2}></stop>
        </radialGradient>
      </defs>
    </svg>
  );
}

export default PhotoMold;