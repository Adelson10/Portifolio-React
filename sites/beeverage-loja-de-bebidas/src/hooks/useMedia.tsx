import React from 'react';

const useMedia = (media: number) => {
    const Media = `(max-width: ${media}px)`;
    const [match, setMatch] = React.useState<boolean>(window.matchMedia(Media).matches);

    React.useEffect(() => {
        function changeMatch() {
            const { matches } = window.matchMedia(Media);            
            setMatch(matches);
        }

        window.addEventListener('resize', changeMatch);
        return () => {
            window.addEventListener('resize', changeMatch);
        }
    },[Media]);

  return match;
}

export default useMedia;