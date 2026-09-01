import ScoreProductPartial from '../ListProductShow/ScoreProductPartial';
// import useFetch from '../../hooks/useFetch';
import CommetMockup from '../../utils/Mockup/CommetMockup';

const Comment = ({review}: {review: reviews}) => {
  // const user = useFetch<User>(`/usuarios/${review.address}`);
  const user = CommetMockup.filter((comment) => comment.id === review.address);
  
  return (
    <div className='reviews-comment-container'>
        <div className="reviews-comment-user-container">
            <div className="reviews-comment-photo-user" style={{backgroundImage: `url(${user[0].photo})`}}></div>
            <div className='reviews-comment-user'>
              <h2 className="reviews-comment-user-name">{user[0].name}</h2>
              <p className='reviews-comment-user-date'>{review.date.toString()}</p>
              <div className="reviews-comment-user-status">{review.status}</div>
            </div>
        </div>
        <div className="reviews-comment">
            <ScoreProductPartial score={review.score}/>
            <p>{review.message}</p>
        </div>
    </div>
  )
}

export default Comment;