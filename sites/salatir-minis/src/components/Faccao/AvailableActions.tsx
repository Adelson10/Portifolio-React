import './AvailableActions.css';

const AvailableAction = ({cp, type, icon, title} : {cp: string, type: string, icon: string, title: string}) => {  
  return (
    <div className="available-actions">
      <div className="available-actions-status-container">
        <span>{cp}</span>
        <span>{type}</span>
      </div>
      <div className='available-actions-status-icon'>
        <div style={{backgroundImage: `url(${icon})`}} className='available-actions-status-icon-image'></div>
      </div>
      <h2>{title}</h2>
    </div>
  );
};

export default AvailableAction;