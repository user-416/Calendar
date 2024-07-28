import { useEffect } from 'react';

const useCenterWithOffset = (offsetRef, containerRef, dir) => {
    useEffect(() => {
        if (!offsetRef.current || !containerRef.current) {
            console.log('Error: element refs not defined');
            return;
        }

        const offsetWidth = offsetRef.current.offsetWidth;
        containerRef.current.style.transform = `translateX(${dir === 'left' ? -offsetWidth / 2 : offsetWidth / 2}px)`;
    });
};

export default useCenterWithOffset;