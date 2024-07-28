import CSS from './Navbar.module.css';
const Navbar = () => {
    return (
        <div className={CSS.navbarContainer}>
            <a href="/" className={CSS.navbarTitle}>CalConnect</a>
        </div>
    );
}
 
export default Navbar;
