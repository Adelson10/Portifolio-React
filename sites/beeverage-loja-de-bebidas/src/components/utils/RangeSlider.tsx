import './RangeSlider.css';
import useMedia from '../../hooks/useMedia';
import React from 'react';

const RangeSlider = ({min, max, onChange}: {min: number, max: number, onChange: any}) => {
  const [minVal, setMinVal] = React.useState(min);
  const [maxVal, setMaxVal] = React.useState(max);
  const minValRef = React.useRef(min);
  const maxValRef = React.useRef(max);
  const range = React.useRef<HTMLDivElement>(null);
  const mobile = useMedia(1000);

  const getPercent = React.useCallback( (value: number) => 
        Math.round(((value - min) / (max - min)) * 100),
      [min, max]
    );
  
    React.useEffect(() => {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxValRef.current);
  
      if (range.current) {
        range.current.style.left = `${!mobile ? minPercent+3 : minPercent+1}%`;
        range.current.style.width = `${((!mobile ? maxPercent*0.94 : maxPercent*0.98 ) - minPercent)}%`;
      }
    }, [minVal, getPercent]);
  
    React.useEffect(() => {
      const minPercent = getPercent(minValRef.current);
      const maxPercent = getPercent(maxVal);
  
      if (range.current) {
        range.current.style.width = `${(!mobile ? maxPercent*0.94 : maxPercent*0.98) - minPercent}%`;
      }
    }, [maxVal, getPercent]);
  
    React.useEffect(() => {
      onChange({ min: minVal, max: maxVal , setMin: setMinVal, setMax: setMaxVal});
    }, [minVal, maxVal]);
  
    return (
      <div className="container">
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          onChange={(event) => {
            const value = Math.min(Number(event.target.value), maxVal - 1);
            setMinVal(value);
            minValRef.current = value;
          }}
          className="thumb thumb--left"
          style={{ zIndex: minVal > max - 100 ? "5" : undefined}}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          onChange={(event) => {
            const value = Math.max(Number(event.target.value), minVal + 1);
            setMaxVal(value);
            maxValRef.current = value;
          }}
          className="thumb thumb--right"
        />
  
        <div className="slider">
          <div className="slider__track" />
          <div ref={range} className="slider__range" />
        </div>
      </div>
    );
  }

  export default RangeSlider;