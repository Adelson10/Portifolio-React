const BarReviews = ({number, Scores, total} : {number: number, Scores: number[], total: number}) => {    
    
  function handleNumber(value: number, total: number) {
    switch (value) {
        case 5:
            if(total > 0)
            return (Scores.filter( (score) => score === 5 ? true : false ).length / total) * 100;
            else return 0;
        case 4:
            if(total > 0)
            return (Scores.filter( (score) => score >= 4 && score < 5 ? true : false ).length / total) * 100;
            else return 0;
        case 3:
            if(total > 0)
            return (Scores.filter( (score) => score >= 3 && score < 4 ? true : false ).length / total) * 100;
            else return 0;
        case 2:
            if(total > 0)
            return (Scores.filter( (score) => score >= 2 && score < 3 ? true : false ).length / total) * 100;
            else return 0;
        case 1:
            if(total > 0)
            return (Scores.filter( (score) => score >= 0 && score < 2 ? true : false ).length / total) * 100;
            else return 0;
        default:
            return 0;
    }
  }

  return (
    <div className="reviews-info-graphics">
        <p>{number.toString()}</p>
        <div className="line-reviews-container">
            <div className="line-reviews" style={{maxWidth: `${handleNumber(number, total)}%`}}></div>
        </div>
    </div>
  )
}

export default BarReviews;