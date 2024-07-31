import CSS from './Navbar.module.css';
const Navbar = () => {
    return (
        <div className={CSS.navbarContainer}>
            <a href="/" className={CSS.navbarTitle}>CalConnect</a>
            <div className={CSS.logoutButton}>
                Logout
            </div>
        </div>
    );
}
 
export default Navbar;
