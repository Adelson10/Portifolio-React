function ShieldIcon({children} : React.PropsWithChildren) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="23"
        height="23"
        fill="none"
        viewBox="0 0 21 21"
      >
        <g fill="#fff" clipPath="url(#clip0_329_242)">
          <path d="M10.75 20.5c-5.514 0-10-4.486-10-10S5.236.5 10.753.5c5.518 0 9.997 4.486 9.997 10s-4.486 10-10 10zm0-19.562c-5.273 0-9.562 4.29-9.562 9.562 0 5.272 4.29 9.562 9.565 9.562 5.277 0 9.56-4.29 9.56-9.562 0-5.273-4.29-9.562-9.563-9.562z"></path>
          <path d="M19.442 11.7a8.734 8.734 0 01-1.699 4.126l-1.548.089-.235 1.675a8.746 8.746 0 01-3.981 1.63l-1.226-1.042-1.306 1.032a8.729 8.729 0 01-3.855-1.575l-.244-1.722-1.604-.091a8.728 8.728 0 01-1.688-4.064l1.037-1.313-1.031-1.207c.216-1.464.8-2.85 1.698-4.026l1.563-.089.238-1.679a8.736 8.736 0 013.888-1.596l1.278 1.01 1.206-1.024a8.73 8.73 0 014.002 1.621l.24 1.668 1.55.088a8.737 8.737 0 011.708 4.08l-.981 1.155.99 1.254z"></path>
        </g>
        <text x="50%" y="50%" textAnchor="middle" fill="black" fontSize="10px" dy=".3em">{children}</text>
        <defs>
          <clipPath id="clip0_329_242">
            <path
              fill="#fff"
              d="M0 0H20V20H0z"
              transform="translate(.75 .5)"
            ></path>
          </clipPath>
        </defs>
      </svg>
    );
  }
  
  export default ShieldIcon;  