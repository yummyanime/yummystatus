import ReactCountryFlag from "react-country-flag";
import { getCountryName } from "../../data/constants.ts";

const Flag = ({ country }: { country: string }) => (
    <ReactCountryFlag
        countryCode={country}
        svg
        style={{
            width: "24px",
            height: "16px",
            borderRadius: "5px",
            flexShrink: 0,
        }}
        title={getCountryName(country)}
    />
);

export default Flag;
