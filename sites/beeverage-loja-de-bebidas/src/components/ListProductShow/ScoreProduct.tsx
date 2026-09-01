import { StarEmpty, StarFill, StarLastEmpty, StarHalf, StarLastFill } from '../../assets/imagens/Product/star/Star';
import './ScoreProduct.css';

const ScoreProduct = ({score}: {score: number}) => {
    const inteiro = Math.floor(score);
    const temMeiaEstrela = score % 1 >= 0.5;
        
  return (
    <div className='score-start'>
      <div className="score-start-icon reverse">
        {[...Array(5)].map((_, index) => {
            const isLastStar = index === 4;
            const starFill = (score === 5 && isLastStar) ? <StarLastFill /> : <StarFill />;
            const startLastHalf = (index === 4 && temMeiaEstrela) ? <StarLastEmpty /> : <StarHalf />;
            const startLastEmpty = (index === 4) ? <StarLastEmpty /> : <StarEmpty />;
            
            if (index < inteiro) {
                return <span key={index}>{starFill}</span>;
            } else if (index === inteiro && temMeiaEstrela) {
                return <span key={index}>{startLastHalf}</span>;
            } else {
                return <span key={index}>{startLastEmpty}</span>;
            }
        })}
      </div>
      {score.toFixed(1)}
      <div className="score-start-icon">
        {[...Array(5)].map((_, index) => {
            const isLastStar = index === 4;
            const starFill = (score === 5 && isLastStar) ? <StarLastFill /> : <StarFill />;
            const startLastHalf = (index === 4 && temMeiaEstrela) ? <StarLastEmpty /> : <StarHalf />;
            const startLastEmpty = (index === 4) ? <StarLastEmpty /> : <StarEmpty />;
            
            if (index < inteiro) {
                return <span key={index}>{starFill}</span>;
            } else if (index === inteiro && temMeiaEstrela) {
                return <span key={index}>{startLastHalf}</span>;
            } else {
                return <span key={index}>{startLastEmpty}</span>;
            }
        })}
      </div>
    </div>
  )
}

export default ScoreProduct
