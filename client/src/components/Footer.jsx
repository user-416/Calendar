import CSS from './Footer.module.css';
const Footer = () => {
    return ( 
        <div className={CSS.footerContainer}>
            <div className={CSS.content}>
                <div className={CSS.nameContainer}>
                    <div className={CSS.name}>CalConnect</div>
                    
                </div>
                <div className={CSS.linksContainer}>
                    <a href="/privacy" className={CSS.privacy}>Privacy</a>
                </div>
                <div className={CSS.contactContainer}>
                    <div className={CSS.contactHeader}>Contact Us</div>
                    <div className={CSS.email}>
                        calconnect@gmail.com
                    </div>
                </div>
            </div>
            <div className={CSS.copyrightContainer}>
                    <div className={CSS.copyrightLine}></div>
                    <div className={CSS.copyright}>@Copyright {new Date().getFullYear()}. All rights reserved.</div>
            </div>
        </div>
     );
}
 
export default Footer;