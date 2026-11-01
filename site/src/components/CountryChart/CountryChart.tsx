import type { HttpLog, LocationGroups } from "../../api.ts";
import { countryCodes, getCountryName, getDomainGroups } from "../../data/constants.ts";
import { useLanguage } from "../../i18n.ts";
import ChartPlug from "../Chart/_plug/ChartPlug.tsx";
import LazyMount from "../LazyMount/LazyMount.tsx";
import CountryChartItem from "./CountryChartItem/CountryChartItem.tsx";
import styles from "./CountryChart.module.scss";

type Location = { country: string; city: string };

interface CountryLogs {
    [country: string]: { [city: string]: HttpLog[] };
}

interface DomainLogsMap {
    [domain: string]: { [city: string]: HttpLog[] };
}

type CountryChartProps = {
    timeRange: string;
    loading: boolean;
} & (
    | {
          type: "country";
          locationGroups: LocationGroups | null;
          httpLogs: CountryLogs;
      }
    | {
          type: "domain";
          domainLogs: DomainLogsMap;
      }
);

const groupLocationsByCountry = (locations: readonly Location[]) =>
    locations
        .reduce(
            (acc, { country, city }) => {
                let group = acc.find((g) => g.countryCode === country);
                if (!group) {
                    group = { countryCode: country, cities: [] };
                    acc.push(group);
                }
                group.cities.push(city);
                return acc;
            },
            [] as { countryCode: string; cities: string[] }[]
        )
        .sort(
            (a, b) =>
                countryCodes.indexOf(a.countryCode) -
                countryCodes.indexOf(b.countryCode)
        );

const CountryChart = (props: CountryChartProps) => {
    const { type, timeRange, loading } = props;
    useLanguage();
    const domainGroups = getDomainGroups();

    if (type === "domain") {
        if (loading) {
            return (
                <>
                    {domainGroups.map((group, index) => (
                        <div key={group.id} className={styles.chartGroup}>
                            <h3 className={styles.groupTitle}>{group.title}</h3>
                            <div className={styles.chartsGrid}>
                                {group.domains.map((entry) => (
                                    <ChartPlug
                                        key={entry.value}
                                        domainName={entry.value}
                                    />
                                ))}
                            </div>
                            {index < domainGroups.length - 1 && (
                                <hr className={styles.chartDivider} />
                            )}
                        </div>
                    ))}
                </>
            );
        }

        const visibleGroups = domainGroups
            .map((group) => ({
                id: group.id,
                title: group.title,
                entries: group.domains.filter(
                    (entry) => props.domainLogs[entry.value]
                ),
            }))
            .filter((group) => group.entries.length > 0);

        return (
            <>
                {visibleGroups.map((group, index) => (
                    <div key={group.id} className={styles.chartGroup}>
                        <h3 className={styles.groupTitle}>{group.title}</h3>
                        <div className={styles.chartsGrid}>
                            {group.entries.map((entry) => (
                                <LazyMount
                                    key={entry.value}
                                    placeholder={
                                        <ChartPlug domainName={entry.value} />
                                    }
                                >
                                    <CountryChartItem
                                        type="domain"
                                        domainName={entry.value}
                                        cityLogs={props.domainLogs[entry.value]}
                                        cities={Object.keys(
                                            props.domainLogs[entry.value]
                                        )}
                                        timeRange={timeRange}
                                    />
                                </LazyMount>
                            ))}
                        </div>
                        {index < visibleGroups.length - 1 && (
                            <hr className={styles.chartDivider} />
                        )}
                    </div>
                ))}
            </>
        );
    }

    if (loading) {
        const groupCounts = [4, 13];
        return (
            <>
                {groupCounts.map((count, index) => (
                    <div key={index} className={styles.chartGroup}>
                        <div className={styles.chartsGrid}>
                            {Array.from({ length: count }).map((_, i) => (
                                <ChartPlug key={`${index}-${i}`} />
                            ))}
                        </div>
                        {index < groupCounts.length - 1 && (
                            <hr className={styles.chartDivider} />
                        )}
                    </div>
                ))}
            </>
        );
    }

    if (!props.locationGroups) return null;

    const intervals = Object.entries(props.locationGroups);

    return (
        <>
            {intervals.map(([interval, locations], index) => {
                const intervalMinutes = parseInt(interval.replace("min", ""));
                const countryGroups = groupLocationsByCountry(locations);

                return (
                    <div key={interval} className={styles.chartGroup}>
                        <div className={styles.chartsGrid}>
                            {countryGroups.map(({ countryCode, cities }) => {
                                return (
                                    <LazyMount
                                        key={countryCode}
                                        placeholder={<ChartPlug />}
                                    >
                                        <CountryChartItem
                                            type="country"
                                            countryCode={countryCode}
                                            countryName={getCountryName(countryCode)}
                                            intervalMinutes={intervalMinutes}
                                            cityLogs={
                                                props.httpLogs[countryCode] || {}
                                            }
                                            cities={cities}
                                            timeRange={timeRange}
                                        />
                                    </LazyMount>
                                );
                            })}
                        </div>
                        {index < intervals.length - 1 && (
                            <hr className={styles.chartDivider} />
                        )}
                    </div>
                );
            })}
        </>
    );
};

export default CountryChart;
