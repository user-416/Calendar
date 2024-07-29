import { useEffect } from 'react';

const useCenterWithOffset = (offsetRef, containerRef, dir, method) => {
    useEffect(() => {
        if (!offsetRef.current || !containerRef.current) {
            console.log('Error: element refs not defined');
            return;
        }

        const offsetWidth = offsetRef.current.offsetWidth;
        if(method === 'transform')
            containerRef.current.style.transform = `translateX(${dir === 'left' ? -offsetWidth / 2 : offsetWidth / 2}px)`;
        else if(method === 'margin')
            containerRef.current.style.marginLeft = `${dir === 'left' ? -offsetWidth / 2 : offsetWidth / 2}px`;
    });
};

export default useCenterWithOffset;