import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Phone, Store } from 'lucide-react';
import { COUNTRIES, regionsFor, zipRequired } from '@/lib/countries';
import {
    FULFILLMENT_METHODS,
    distributorDetails,
    fetchCountryDistributor,
} from '@/lib/distributors';

const input = 'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-[hsl(var(--gold))]';

const DistributorPanel = ({ details, countryName: cName }) => {
    if (!details) return null;
    return (
        <div className="mt-4 border border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/5 p-5">
            <p className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                <Store size={14} strokeWidth={1.6} /> Collection point — {cName}
            </p>
            <p className="mt-3 font-display text-xl">{details.organisation || details.name}</p>
            {details.name && details.organisation ? (
                <p className="mt-1 text-sm text-muted-foreground">{details.name}</p>
            ) : null}
            {details.territory ? (
                <p className="mt-2 text-xs text-muted-foreground">Territory: {details.territory}</p>
            ) : null}
            {details.address ? (
                <p className="mt-3 flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-[hsl(var(--gold))]" />
                    {details.address}
                </p>
            ) : null}
            {details.hours ? (
                <p className="mt-2 text-xs text-muted-foreground">Hours: {details.hours}</p>
            ) : null}
            {details.phone ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={13} className="text-[hsl(var(--gold))]" />
                    {details.phone}
                </p>
            ) : null}
            {details.email ? (
                <p className="mt-1 text-xs text-muted-foreground">{details.email}</p>
            ) : null}
        </div>
    );
};

/**
 * Shared country + fulfillment + distributor lookup for checkout and events.
 */
const CountryCollectionFields = ({
    country,
    region,
    fulfillmentMethod,
    onCountry,
    onRegion,
    onFulfillmentMethod,
    showFulfillment = true,
    requireRegion = true,
    className = '',
}) => {
    const [loadingDist, setLoadingDist] = useState(false);
    const [match, setMatch] = useState(null);

    const countryRegions = useMemo(() => regionsFor(country), [country]);
    const needsZip = zipRequired(country);
    const details = distributorDetails(match?.distributor);
    const cName = COUNTRIES.find((c) => c.code === country)?.name || country;

    useEffect(() => {
        let active = true;
        setLoadingDist(true);
        fetchCountryDistributor(country)
            .then((res) => { if (active) setMatch(res); })
            .catch(() => { if (active) setMatch(null); })
            .finally(() => { if (active) setLoadingDist(false); });
        return () => { active = false; };
    }, [country]);

    useEffect(() => {
        if (fulfillmentMethod === 'distributor_collection' && !details && !loadingDist) {
            onFulfillmentMethod('ship');
        }
    }, [fulfillmentMethod, details, loadingDist, onFulfillmentMethod]);

    const canCollect = !!details;

    return (
        <div className={className}>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Country *</label>
                    <select className={input} required value={country} onChange={(e) => onCountry(e.target.value)}>
                        {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-2">
                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                        Region / State{requireRegion ? ' *' : ''}
                    </label>
                    {countryRegions.length > 0 ? (
                        <select
                            className={input}
                            required={requireRegion}
                            value={region}
                            onChange={(e) => onRegion(e.target.value)}
                        >
                            <option value="" disabled>Select region</option>
                            {countryRegions.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            className={input}
                            required={requireRegion}
                            value={region}
                            onChange={(e) => onRegion(e.target.value)}
                            placeholder="Enter region / state"
                        />
                    )}
                </div>
            </div>

            {showFulfillment ? (
                <div className="mt-5 grid gap-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Fulfilment</p>
                    {FULFILLMENT_METHODS.map((m) => {
                        const disabled = m.value === 'distributor_collection' && !canCollect;
                        return (
                            <label
                                key={m.value}
                                className={`flex cursor-pointer gap-3 border p-4 transition-colors ${
                                    fulfillmentMethod === m.value
                                        ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/5'
                                        : 'border-border'
                                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="fulfillment"
                                    value={m.value}
                                    checked={fulfillmentMethod === m.value}
                                    disabled={disabled}
                                    onChange={() => onFulfillmentMethod(m.value)}
                                    className="mt-1"
                                />
                                <span>
                                    <span className="block text-sm">{m.label}</span>
                                    <span className="mt-1 block text-xs text-muted-foreground">
                                        {disabled && m.value === 'distributor_collection'
                                            ? 'No distributor listed for this country yet — choose shipping instead.'
                                            : m.hint}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>
            ) : null}

            {loadingDist ? (
                <p className="mt-4 text-xs text-muted-foreground">Looking up distributor for {cName}…</p>
            ) : null}

            {fulfillmentMethod === 'distributor_collection' && details ? (
                <DistributorPanel details={details} countryName={cName} />
            ) : null}

            {!showFulfillment && canCollect ? (
                <DistributorPanel details={details} countryName={cName} />
            ) : null}
        </div>
    );
};

export { DistributorPanel, input as collectionInput, zipRequired };
export default CountryCollectionFields;
