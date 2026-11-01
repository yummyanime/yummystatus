import React from "react";
import { Link } from "react-router-dom";
import styles from "./SubMenuItem.module.scss";
import Ripple from "../../../../tools/Ripple/Ripple.tsx";
import { type SubMenuLink } from "../../SubMenu/SubMenu.tsx";

const SubMenuItem: React.FC<SubMenuLink> = ({ icon, title, href, onClick, content }) => {
    const isLink = href !== "#";

    return (
        <Ripple
            className={styles.container}
            tag={isLink ? Link : "div"}
            to={isLink ? href : undefined}
            onClick={(e) => {
                if (!isLink) e.stopPropagation();
                if (!(e.target as Element).closest("button")) onClick?.(e);
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
