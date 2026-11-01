import cn from "classnames";
import styles from "./LanguageDialog.module.scss";
import Dialog from "../Dialog/Dialog.tsx";
import TabbedBlock from "../TabbedBlock/TabbedBlock.tsx";
import Ripple from "../../tools/Ripple/Ripple.tsx";
import { useHashDialog } from "../../hooks/useHashDialog.ts";
import { FlagIcon } from "../../icons.tsx";
import { LANGUAGES, setLanguage, useLanguage } from "../../i18n.ts";

export default function LanguageDialog() {
    const { shown, closing, close } = useHashDialog("language");
    const { language, t } = useLanguage();

    if (!shown) return null;

    return (
        <Dialog onClose={() => close()} closing={closing}>
            <TabbedBlock
                items={[
                    {
                        title: t("navLanguage"),
                        content: LANGUAGES.map(({ id, title }) => (
                            <Ripple
                                key={id}
                                className={cn(styles.lang, id === language && styles.selected)}
                                onClick={() => {
                                    setLanguage(id);
                                    close();
                                }}
                            >
                                <FlagIcon language={id} />
                                {title}
                            </Ripple>
                        )),
                    },
                ]}
            />
        </Dialog>
    );
}
