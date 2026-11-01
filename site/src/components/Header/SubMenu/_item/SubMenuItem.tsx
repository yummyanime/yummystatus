import React from "react";
import { Link } from "react-router-dom";
import styles from "./SubMenuItem.module.scss";
import Ripple from "../../../../tools/Ripple/Ripple.tsx";
import { type SubMenuLink } from "../../SubMenu/SubMenu.tsx";

const SubMenuItem: React.FC<SubMenuLink> = ({ icon, title, href, onClick, content }) => {
    return (
        <Ripple
            className={styles.container}
            tag={Link}
            to={href}
            onClick={(e) => {
                if (href === "#") {
                    e.preventDefault();
                    e.stopPropagation();
                }
                onClick?.(e);
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {icon}
            <span className={styles.title}>{title}</span>
            {content && <span className={styles.content}>{content}</span>}
        </Ripple>
    );
};

export default SubMenuItem;
