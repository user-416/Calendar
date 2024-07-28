import {useEffect} from 'react';
const useOutsideClick = (ref, setOpen) => {
    useEffect(() => {
        const handleClickOutside = () => {
            if(ref.current && !ref.current.contains(event.target))
                setOpen(false);
        }
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        }
    }, []);
}

export default useOutsideClick;
