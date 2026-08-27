import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowDownLeft, ArrowLeftRight, ArrowRight, ArrowUp, ArrowUpRight, CheckCircle2, ChevronRight, Download, Globe2, Info, LoaderCircle, RefreshCw, Search, Send, Star, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BrandedSelect } from "../components/BrandedSelect";
import HorizontalScrollHint from "../components/HorizontalScrollHint";
import { useGlobalOperationsSupabase, type GlobalOperationInput, type GlobalOperationStatus, type GlobalOperationType } from "../hooks/useGlobalSupabase";

const money = (value: number, currency: string) => new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const dateLabel = (value: string) => new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
const GLOBAL_CURRENCY_PAIR_KEY = "bitaxus-global-currency-pair";
const FAVORITE_CURRENCY_PAIRS_KEY = "bitaxus-global-favorite-currency-pairs";

const GLOBAL_CURRENCIES = [
  { code: "COP", name: "Peso colombiano", symbol: "$", flag: "🇨🇴" },
  { code: "USD", name: "Dólar estadounidense", symbol: "US$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "Libra esterlina", symbol: "£", flag: "🇬🇧" },
  { code: "MXN", name: "Peso mexicano", symbol: "$", flag: "🇲🇽" },
  { code: "BRL", name: "Real brasileño", symbol: "R$", flag: "🇧🇷" },
  { code: "CLP", name: "Peso chileno", symbol: "$", flag: "🇨🇱" },
  { code: "PEN", name: "Sol peruano", symbol: "S/", flag: "🇵🇪" },
  { code: "ARS", name: "Peso argentino", symbol: "$", flag: "🇦🇷" },
  { code: "CAD", name: "Dólar canadiense", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", name: "Dólar australiano", symbol: "A$", flag: "🇦🇺" },
  { code: "CHF", name: "Franco suizo", symbol: "CHF", flag: "🇨🇭" },
  { code: "JPY", name: "Yen japonés", symbol: "¥", flag: "🇯🇵" },
  { code: "CNY", name: "Yuan chino", symbol: "¥", flag: "🇨🇳" },
  { code: "AED", name: "Dírham de EAU", symbol: "AED", flag: "🇦🇪" },
  { code: "CRC", name: "Colón costarricense", symbol: "₡", flag: "🇨🇷" },
] as const;

type GlobalCurrency = (typeof GLOBAL_CURRENCIES)[number];
type CurrencyPair = { source: string; target: string };
type ReferenceQuote = { base: string; quote: string; rate: number; date: string };

function FlagArtwork({ code }: { code: string }) {
  if (code === "USD") return <><rect width="24" height="16" fill="#fff" />{[0, 2, 4, 6, 8, 10, 12, 14].map(y => <rect key={y} y={y} width="24" height="1.25" fill="#c94b55" />)}<rect width="10" height="8.5" fill="#263d73" /><g fill="#fff"><circle cx="2" cy="2" r=".55" /><circle cx="5" cy="2" r=".55" /><circle cx="8" cy="2" r=".55" /><circle cx="3.5" cy="4" r=".55" /><circle cx="6.5" cy="4" r=".55" /><circle cx="2" cy="6" r=".55" /><circle cx="5" cy="6" r=".55" /><circle cx="8" cy="6" r=".55" /></g></>;
  if (code === "EUR") return <><rect width="24" height="16" fill="#284b8f" />{Array.from({ length: 12 }, (_, index) => { const angle = index * 30 * Math.PI / 180; return <circle key={index} cx={12 + Math.cos(angle) * 4.5} cy={8 + Math.sin(angle) * 4.5} r=".7" fill="#f5ca52" />; })}</>;
  if (code === "GBP") return <><rect width="24" height="16" fill="#294c91" /><path d="M0 2L21 16M3 16L24 2M12 0V16M0 8H24" stroke="#fff" strokeWidth="3" /><path d="M0 2L21 16M3 16L24 2M12 0V16M0 8H24" stroke="#c94955" strokeWidth="1.2" /></>;
  if (code === "MXN") return <><rect width="8" height="16" fill="#27865a" /><rect x="8" width="8" height="16" fill="#fff" /><rect x="16" width="8" height="16" fill="#c94955" /><circle cx="12" cy="8" r="1.3" fill="#b4954a" /></>;
  if (code === "BRL") return <><rect width="24" height="16" fill="#26945c" /><path d="M12 2L21 8L12 14L3 8Z" fill="#f1c849" /><circle cx="12" cy="8" r="3.4" fill="#2e579b" /><path d="M8.8 7.5c2.2-1.5 4.6-1.2 6.5.2" fill="none" stroke="#fff" strokeWidth=".65" /></>;
  if (code === "CLP") return <><rect width="24" height="8" fill="#fff" /><rect y="8" width="24" height="8" fill="#c94955" /><rect width="9" height="8" fill="#294c91" /><circle cx="4.5" cy="4" r="1.5" fill="#fff" /></>;
  if (code === "PEN") return <><rect width="8" height="16" fill="#c94955" /><rect x="8" width="8" height="16" fill="#fff" /><rect x="16" width="8" height="16" fill="#c94955" /></>;
  if (code === "ARS") return <><rect width="24" height="5.33" fill="#79b9dc" /><rect y="5.33" width="24" height="5.34" fill="#fff" /><rect y="10.67" width="24" height="5.33" fill="#79b9dc" /><circle cx="12" cy="8" r="1.5" fill="#efc64f" /></>;
  if (code === "CAD") return <><rect width="6" height="16" fill="#c94955" /><rect x="6" width="12" height="16" fill="#fff" /><rect x="18" width="6" height="16" fill="#c94955" /><path d="M12 3l1 3 2-.8-1 2 2 1-2 .7.5 2.8-2.5-1.4L9.5 12l.5-2.8-2-.7 2-1-1-2 2 .8Z" fill="#c94955" /></>;
  if (code === "AUD") return <><rect width="24" height="16" fill="#294c91" /><path d="M0 2L9 8L0 14M3 0L12 6M3 16L12 10M12 0V16M0 8H14" stroke="#fff" strokeWidth="2" /><path d="M0 2L9 8L0 14M3 0L12 6M3 16L12 10M12 0V16M0 8H14" stroke="#c94955" strokeWidth=".7" /><g fill="#fff"><circle cx="18" cy="5" r="1" /><circle cx="20.5" cy="8" r=".6" /><circle cx="18" cy="11" r=".65" /></g></>;
  if (code === "CHF") return <><rect width="24" height="16" fill="#c94955" /><path d="M9 3h6v4h4v4h-4v4H9v-4H5V7h4Z" fill="#fff" /></>;
  if (code === "JPY") return <><rect width="24" height="16" fill="#fff" /><circle cx="12" cy="8" r="4" fill="#c94955" /></>;
  if (code === "CNY") return <><rect width="24" height="16" fill="#c94955" /><path d="M5 2l.7 1.5 1.7.2-1.3 1 .4 1.7L5 5.5 3.5 6.4l.4-1.7-1.3-1 1.7-.2Z" fill="#f5ca52" /></>;
  if (code === "AED") return <><rect width="24" height="5.33" fill="#26945c" /><rect y="5.33" width="24" height="5.34" fill="#fff" /><rect y="10.67" width="24" height="5.33" fill="#1f1d1e" /><rect width="4" height="16" fill="#c94955" /></>;
  if (code === "CRC") return <><rect width="24" height="3" fill="#294c91" /><rect y="3" width="24" height="2.5" fill="#fff" /><rect y="5.5" width="24" height="5" fill="#c94955" /><rect y="10.5" width="24" height="2.5" fill="#fff" /><rect y="13" width="24" height="3" fill="#294c91" /></>;
  return <><rect width="24" height="8" fill="#f4d14d" /><rect y="8" width="24" height="4" fill="#2e579b" /><rect y="12" width="24" height="4" fill="#c94955" /></>;
}

function CurrencyFlag({ currency, className = "" }: { currency: GlobalCurrency; className?: string }) {
  return <i className={`currency-flag ${className}`} aria-hidden="true"><svg viewBox="0 0 24 16" preserveAspectRatio="xMidYMid slice" focusable="false"><FlagArtwork code={currency.code} /></svg></i>;
}

const rateLabel = (value: number) => new Intl.NumberFormat("es-CO", { maximumSignificantDigits: 7 }).format(value);
const parseAmount = (value: string) => Number(value.replaceAll(".", "").replace(",", "."));
const formatAmount = (value: string) => {
  const [whole = "", decimal] = value.replaceAll(".", "").replace(/[^\d,]/g, "").split(",");
  const cleanWhole = whole.replace(/^0+(?=\d)/, "") || (decimal !== undefined ? "0" : "");
  const formattedWhole = cleanWhole ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Number(cleanWhole)) : "";
  return decimal === undefined ? formattedWhole : `${formattedWhole || "0"},${decimal.slice(0, 2)}`;
};
const pairKey = (pair: CurrencyPair) => `${pair.source}-${pair.target}`;

function getSavedFavoritePairs(): CurrencyPair[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITE_CURRENCY_PAIRS_KEY) ?? "[]");
    const isValidCode = (code: unknown): code is string => typeof code === "string" && GLOBAL_CURRENCIES.some(currency => currency.code === code);
    return Array.isArray(parsed) ? parsed.filter((pair): pair is CurrencyPair => isValidCode(pair?.source) && isValidCode(pair?.target) && pair.source !== pair.target) : [];
  } catch {
    return [];
  }
}

function getSavedCurrencyPair(): CurrencyPair {
  if (typeof window === "undefined") return { source: "COP", target: "USD" };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GLOBAL_CURRENCY_PAIR_KEY) ?? "{}");
    const isValid = (code: unknown): code is string => typeof code === "string" && GLOBAL_CURRENCIES.some(currency => currency.code === code);
    return isValid(parsed.source) && isValid(parsed.target) && parsed.source !== parsed.target ? { source: parsed.source, target: parsed.target } : { source: "COP", target: "USD" };
  } catch {
    return { source: "COP", target: "USD" };
  }
}

export default function Global({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { tenant } = useAuth();
  const [tab, setTab] = useState("Todas");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<GlobalOperationStatus | "Todos">("Todos");
  const [modal, setModal] = useState<GlobalOperationType | null>(null);
  const [currencyPair, setCurrencyPair] = useState<CurrencyPair>(getSavedCurrencyPair);
  const [favoritePairs, setFavoritePairs] = useState<CurrencyPair[]>(getSavedFavoritePairs);
  const [operationIntent, setOperationIntent] = useState<GlobalOperationType>("Conversión");
  const [operationAmount, setOperationAmount] = useState("");
  const [referenceQuote, setReferenceQuote] = useState<ReferenceQuote | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<"loading" | "ready" | "error">("loading");
  const [quoteTrend, setQuoteTrend] = useState<"up" | "down" | null>(null);
  const [quoteRefreshKey, setQuoteRefreshKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ source_currency: "COP", target_currency: "USD", source_amount: "", target_amount: "", exchange_rate: "", account: "", counterparty: "", reference: "", description: "", operation_date: new Date().toISOString().slice(0, 10) });

  const filters = useMemo(() => ({ operationType: tab === "Todas" ? undefined : tab === "Recepciones" ? "Recepción" as const : "Conversión" as const, status: status === "Todos" ? undefined : status, search: query || undefined }), [tab, status, query]);
  const { operationsQuery, createOperation, updateStatus } = useGlobalOperationsSupabase(tenant?.id, filters);
  const { operationsQuery: balanceOperationsQuery } = useGlobalOperationsSupabase(tenant?.id);
  const operations = operationsQuery.data ?? [];
  const balanceOperations = balanceOperationsQuery.data ?? [];
  const balances = useMemo(() => balanceOperations.reduce<Record<string, number>>((sum, item) => {
    if (!['Cancelada', 'Fallida'].includes(item.status)) {
      sum[item.source_currency] = (sum[item.source_currency] ?? 0) + (item.operation_type === "Dispersión" ? -Number(item.source_amount) : Number(item.source_amount));
    }
    if (item.operation_type === "Conversión" && item.target_currency && item.target_amount) {
      sum[item.target_currency] = (sum[item.target_currency] ?? 0) + Number(item.target_amount);
    }
    return sum;
  }, {}), [balanceOperations]);
  const sourceCurrency = useMemo(() => GLOBAL_CURRENCIES.find(currency => currency.code === currencyPair.source) ?? GLOBAL_CURRENCIES[0], [currencyPair.source]);
  const targetCurrency = useMemo(() => GLOBAL_CURRENCIES.find(currency => currency.code === currencyPair.target) ?? GLOBAL_CURRENCIES[1], [currencyPair.target]);
  const confirmationSourceCurrency = useMemo(() => GLOBAL_CURRENCIES.find(currency => currency.code === form.source_currency) ?? sourceCurrency, [form.source_currency, sourceCurrency]);
  const confirmationTargetCurrency = useMemo(() => GLOBAL_CURRENCIES.find(currency => currency.code === form.target_currency) ?? targetCurrency, [form.target_currency, targetCurrency]);
  const currencyOptions = useMemo(() => GLOBAL_CURRENCIES.map(currency => ({ value: currency.code, label: <span className="global-inline-currency"><CurrencyFlag currency={currency} /><b>{currency.code}</b><small>{currency.name}</small></span> })), []);

  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const open = (type: GlobalOperationType, sourceCode = form.source_currency, targetCode = form.target_currency) => {
    const numericAmount = parseAmount(operationAmount);
    const quoteIsCurrent = referenceQuote?.base === sourceCode && referenceQuote.quote === targetCode;
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setNotice(`Ingresa el importe que vas a ${type === "Recepción" ? "recibir" : type === "Conversión" ? "convertir" : "dispersar"} en la tarjeta de moneda.`);
      return;
    }
    if (type === "Conversión" && !quoteIsCurrent) {
      setNotice("Espera la cotización de referencia antes de continuar con la conversión.");
      return;
    }
    setModal(type);
    update("source_currency", sourceCode);
    if (type === "Conversión") update("target_currency", targetCode === sourceCode ? GLOBAL_CURRENCIES.find(currency => currency.code !== sourceCode)?.code ?? "USD" : targetCode);
    update("source_amount", String(numericAmount));
    update("target_amount", type === "Conversión" && quoteIsCurrent ? formatAmount((numericAmount * referenceQuote.rate).toFixed(2).replace(".", ",")) : "");
    update("exchange_rate", type === "Conversión" && quoteIsCurrent ? String(referenceQuote.rate) : "");
    update("description", "");
  };

  const selectedOperationCurrency = operationIntent === "Recepción" ? targetCurrency : sourceCurrency;
  const selectedOperationLabel = operationIntent === "Recepción" ? "Importe a recibir" : operationIntent === "Conversión" ? "Importe a convertir" : "Importe a dispersar";
  const convertedAmount = useMemo(() => {
    const numericAmount = parseAmount(operationAmount);
    if (operationIntent !== "Conversión" || quoteStatus !== "ready" || !referenceQuote || !Number.isFinite(numericAmount) || numericAmount <= 0) return null;
    return numericAmount * referenceQuote.rate;
  }, [operationAmount, operationIntent, quoteStatus, referenceQuote]);
  const swapCurrencyPair = () => setCurrencyPair(current => ({ source: current.target, target: current.source }));
  const startSelectedOperation = () => {
    if (operationIntent === "Recepción") open("Recepción", targetCurrency.code);
    else if (operationIntent === "Conversión") open("Conversión", sourceCurrency.code, targetCurrency.code);
    else open("Dispersión", sourceCurrency.code);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(GLOBAL_CURRENCY_PAIR_KEY, JSON.stringify(currencyPair));
    } catch {
      // El par se conserva durante la sesión si el navegador no permite persistencia local.
    }
  }, [currencyPair]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITE_CURRENCY_PAIRS_KEY, JSON.stringify(favoritePairs));
    } catch {
      // Los pares siguen disponibles durante la sesión si el navegador no permite persistencia local.
    }
  }, [favoritePairs]);

  useEffect(() => {
    let active = true;
    setQuoteStatus("loading");
    setReferenceQuote(null);
    setQuoteTrend(null);
    fetch(`https://api.frankfurter.dev/v2/rate/${sourceCurrency.code}/${targetCurrency.code}`)
      .then(async response => {
        if (!response.ok) throw new Error(`No se pudo consultar la cotización (${response.status}).`);
        return response.json() as Promise<ReferenceQuote>;
      })
      .then(async quote => {
        if (!active || !Number.isFinite(quote.rate) || quote.base !== sourceCurrency.code || quote.quote !== targetCurrency.code) return;
        setReferenceQuote(quote);
        setQuoteStatus("ready");
        const previousDate = new Date(`${quote.date}T12:00:00Z`);
        previousDate.setUTCDate(previousDate.getUTCDate() - 7);
        try {
          const historicalResponse = await fetch(`https://api.frankfurter.dev/v2/rate/${sourceCurrency.code}/${targetCurrency.code}?date=${previousDate.toISOString().slice(0, 10)}`);
          if (!historicalResponse.ok) return;
          const historicalQuote = await historicalResponse.json() as ReferenceQuote;
          if (active && Number.isFinite(historicalQuote.rate) && historicalQuote.rate !== quote.rate) setQuoteTrend(quote.rate > historicalQuote.rate ? "up" : "down");
        } catch {
          // La tasa actual se conserva aunque no exista comparación histórica para ese par.
        }
      })
      .catch(() => {
        if (active) setQuoteStatus("error");
      });
    return () => { active = false; };
  }, [sourceCurrency.code, targetCurrency.code, quoteRefreshKey]);

  const isCurrentPairFavorite = favoritePairs.some(pair => pairKey(pair) === pairKey(currencyPair));
  const toggleCurrentPairFavorite = () => setFavoritePairs(current => isCurrentPairFavorite ? current.filter(pair => pairKey(pair) !== pairKey(currencyPair)) : [...current, currencyPair]);
  const chooseSourceCurrency = (code: string) => setCurrencyPair(current => code === current.target ? { source: code, target: current.source } : { ...current, source: code });
  const chooseTargetCurrency = (code: string) => setCurrencyPair(current => code === current.source ? { source: current.target, target: code } : { ...current, target: code });

  const submit = () => {
    if (!modal) return;
    const input: GlobalOperationInput = {
      operation_type: modal,
      source_currency: form.source_currency,
      target_currency: modal === "Conversión" ? form.target_currency : undefined,
      source_amount: parseAmount(form.source_amount),
      target_amount: modal === "Conversión" ? parseAmount(form.target_amount) : undefined,
      exchange_rate: modal === "Conversión" ? Number(form.exchange_rate) : undefined,
      account: form.account || undefined,
      counterparty: form.counterparty || undefined,
      reference: form.reference || undefined,
      description: form.description || undefined,
      operation_date: form.operation_date,
    };
    createOperation.mutate(input, {
      onSuccess: () => {
        setModal(null);
        setNotice("Operación Global guardada correctamente.");
        window.setTimeout(() => setNotice(""), 4200);
      },
      onError: error => setNotice(error.message),
    });
  };

  useEffect(() => {
    if (!modal || createOperation.isPending) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [modal, createOperation.isPending]);

  const exportGlobal = () => {
    const columns = ["id", "operation_type", "source_currency", "source_amount", "target_currency", "target_amount", "operation_date", "status"];
    const csv = [columns.join(","), ...operations.map(item => columns.map(column => JSON.stringify((item as unknown as Record<string, unknown>)[column] ?? "")).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bitaxus-global.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const disabled = createOperation.isPending || !form.source_amount || (modal === "Conversión" && (!form.target_amount || !form.exchange_rate));

  return (
    <section className="global-page">
      <header className="global-header">
        <div>
          <div className="global-title"><h2>Bitaxus Global</h2></div>
          <p>Recibe, convierte y usa los valores disponibles en tu operación.</p>
        </div>
        <button className="go-payments" onClick={() => onNavigate("Pagos y dispersiones")}>Ir a Pagos y dispersiones <ArrowUpRight size={16} /></button>
      </header>

      {notice && <div className="receipt-success-message operation-success-message global-success-message" role="status" aria-live="polite"><span className="receipt-success-icon"><CheckCircle2 size={18} /></span><span>{notice}</span><button type="button" aria-label="Cerrar mensaje" onClick={() => setNotice("")}><X size={15} /></button></div>}

      <div className="global-layout">
        <main>
          <section className="global-operation-shell global-operation-minimal">
            <div className="minimal-operation-top"><span>Nueva operación</span><div className="global-operation-choice" role="group" aria-label="Selecciona la operación"><button type="button" className={operationIntent === "Recepción" ? "selected" : ""} onClick={() => setOperationIntent("Recepción")}><ArrowDownLeft size={14} />Recibir</button><button type="button" className={operationIntent === "Conversión" ? "selected" : ""} onClick={() => setOperationIntent("Conversión")}><ArrowLeftRight size={14} />Convertir</button><button type="button" className={operationIntent === "Dispersión" ? "selected" : ""} onClick={() => setOperationIntent("Dispersión")}><Send size={14} />Dispersar</button></div></div>
            <div className="minimal-operation-body">
              <section className="minimal-pair" aria-label="Par de monedas"><div className="minimal-pair-title"><span className="minimal-field-label">Par</span><button className={`save-currency-pair${isCurrentPairFavorite ? " is-saved" : ""}`} type="button" onClick={toggleCurrentPairFavorite} aria-pressed={isCurrentPairFavorite}><Star size={13} fill={isCurrentPairFavorite ? "currentColor" : "none"} />{isCurrentPairFavorite ? "Guardado" : "Guardar par"}</button></div><div className="minimal-pair-row"><BrandedSelect className="global-currency-select" value={sourceCurrency.code} onChange={chooseSourceCurrency} options={currencyOptions} aria-label="Moneda de origen" /><button type="button" className="swap-currency-pair" onClick={swapCurrencyPair} aria-label={`Intercambiar ${sourceCurrency.code} y ${targetCurrency.code}`} title="Intercambiar origen y destino"><ArrowLeftRight size={14} /></button><BrandedSelect className="global-currency-select" value={targetCurrency.code} onChange={chooseTargetCurrency} options={currencyOptions} aria-label="Moneda de destino" /></div>{favoritePairs.length > 0 && <div className="global-pair-favorites" aria-label="Pares guardados">{favoritePairs.map(pair => { const source = GLOBAL_CURRENCIES.find(currency => currency.code === pair.source); const target = GLOBAL_CURRENCIES.find(currency => currency.code === pair.target); return source && target ? <button key={pairKey(pair)} type="button" className={pairKey(pair) === pairKey(currencyPair) ? "active" : ""} onClick={() => setCurrencyPair(pair)}><CurrencyFlag currency={source} className="currency-flag-inline" /> {source.code} <ArrowRight size={10} /> <CurrencyFlag currency={target} className="currency-flag-inline" /> {target.code}</button> : null; })}</div>}</section>
              <section className="minimal-amount"><label className="global-operation-amount"><span>{selectedOperationLabel}</span><div><b aria-hidden="true">{selectedOperationCurrency.symbol}</b><input type="text" inputMode="decimal" value={operationAmount} onChange={event => setOperationAmount(formatAmount(event.target.value))} placeholder="0,00" aria-label={`${selectedOperationLabel} en ${selectedOperationCurrency.code}`} /><small>{selectedOperationCurrency.code}</small></div></label>{operationIntent === "Conversión" && <div className={`minimal-result${convertedAmount !== null ? " is-ready" : ""}`} aria-live="polite"><span>Recibirás</span><strong key={convertedAmount ?? "empty"}>{convertedAmount !== null ? money(convertedAmount, targetCurrency.code) : `— ${targetCurrency.code}`}</strong></div>}</section>
            </div>
            <footer className="minimal-operation-footer"><section className={`minimal-quote ${quoteStatus}`} aria-live="polite">{quoteStatus === "loading" && <b><LoaderCircle size={14} className="spin" /> Consultando tasa</b>}{quoteStatus === "ready" && referenceQuote && <b>1 {sourceCurrency.code} = {rateLabel(referenceQuote.rate)} {targetCurrency.code}{quoteTrend && <em className={`quote-trend ${quoteTrend}`}><>{quoteTrend === "up" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}</>{quoteTrend === "up" ? "Subió" : "Bajó"}</em>}</b>}{quoteStatus === "error" && <b>No se pudo consultar la tasa</b>}<button type="button" onClick={() => setQuoteRefreshKey(value => value + 1)} aria-label={quoteStatus === "loading" ? "Actualizando cotización de referencia" : "Actualizar cotización de referencia"} aria-busy={quoteStatus === "loading"} disabled={quoteStatus === "loading"}>{quoteStatus === "loading" ? <LoaderCircle size={13} className="spin" /> : <RefreshCw size={13} />}</button></section><button type="button" className="global-operation-continue" onClick={startSelectedOperation}>Continuar <ArrowRight size={15} /></button></footer>
          </section>

          <div className="global-activity panel">
            <div className="global-activity-head">
              <div><h3>Actividad de Global</h3><div className="global-tabs">{["Todas", "Recepciones", "Conversiones"].map(item => <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>)}</div></div>
              <label className="global-search"><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por ID, contraparte o referencia" /></label>
            </div>
            <div className="global-filters"><select value={status} onChange={event => setStatus(event.target.value as GlobalOperationStatus | "Todos")} aria-label="Filtrar por estado"><option>Todos</option><option>Pendiente</option><option>En proceso</option><option>Confirmada</option><option>Procesada</option><option>Cancelada</option><option>Fallida</option></select><button className="clear-filters" onClick={() => { setQuery(""); setTab("Todas"); setStatus("Todos"); }}>↻ Limpiar filtros</button><button className="export-btn" onClick={exportGlobal}><Download size={14} /> Exportar</button></div>
            <HorizontalScrollHint className="global-table-wrap">
              <table className="global-table"><thead><tr><th>ID</th><th>Tipo</th><th>Operación</th><th>Valor</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{operationsQuery.isLoading ? <tr><td colSpan={7}>Cargando operaciones Global…</td></tr> : operations.length === 0 ? <tr><td colSpan={7}>No hay operaciones Global registradas.</td></tr> : operations.map(item => <tr key={item.id}><td>{item.id}</td><td><span className={`global-type ${item.operation_type === "Conversión" ? "coral" : "green"}`}>{item.operation_type === "Recepción" ? <ArrowDownLeft size={15} /> : item.operation_type === "Conversión" ? <ArrowLeftRight size={15} /> : <Send size={15} />}</span></td><td>{item.operation_type}</td><td>{money(Number(item.source_amount), item.source_currency)}</td><td>{dateLabel(item.operation_date)}</td><td><span className={`global-status ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span></td><td>{!["Cancelada", "Fallida", "Procesada"].includes(item.status) && <button className="table-action" onClick={() => updateStatus.mutate({ id: item.id, status: item.operation_type === "Recepción" ? "Confirmada" : "Procesada" })}>{updateStatus.isPending ? <LoaderCircle size={14} className="spin" /> : <CheckCircle2 size={14} />} Confirmar</button>}<ChevronRight size={16} /></td></tr>)}</tbody></table>
            </HorizontalScrollHint>
            <div className="global-footer"><span>{operations.length} operación(es) visibles</span></div>
          </div>
        </main>

      </div>

      {modal && <div className="modal-backdrop" onClick={() => !createOperation.isPending && setModal(null)}><div className="action-modal global-modal global-confirmation-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => !createOperation.isPending && setModal(null)} aria-label="Cerrar"><X size={17} /></button><div className="modal-icon"><Globe2 size={17} /></div><h2>Revisa tu operación</h2><p>Confirma que el valor y las monedas coincidan antes de finalizar.</p><div className="global-operation-summary"><span className="global-summary-kicker">{modal === "Conversión" ? "Conversión preparada" : modal === "Recepción" ? "Recepción preparada" : "Dispersión preparada"}</span><div className="global-summary-route"><div className="global-summary-currency"><CurrencyFlag currency={confirmationSourceCurrency} /><span><small>{modal === "Recepción" ? "Vas a recibir" : "Monto de origen"}</small><b>{money(Number(form.source_amount), form.source_currency)}</b></span></div>{modal === "Conversión" && <><ArrowRight size={18} className="global-summary-arrow" /><div className="global-summary-currency target"><CurrencyFlag currency={confirmationTargetCurrency} /><span><small>Recibirás estimado</small><b>{money(Number(form.target_amount), form.target_currency)}</b></span></div></>}</div>{modal === "Conversión" && <div className="global-summary-rate"><span>Tasa de referencia</span><b>1 {form.source_currency} = {rateLabel(Number(form.exchange_rate))} {form.target_currency}</b></div>}<small className="global-summary-context">{modal === "Recepción" ? `Moneda destino · ${form.source_currency}` : modal === "Dispersión" ? `Moneda origen · ${form.source_currency}` : `${form.source_currency} → ${form.target_currency}`}</small></div><div className="modal-actions"><button className="secondary-action" onClick={() => setModal(null)}>Volver</button><button className="primary-action" onClick={submit} disabled={createOperation.isPending}>{createOperation.isPending ? <><LoaderCircle size={14} className="spin" /> Guardando...</> : "Confirmar operación"}</button></div></div></div>}
    </section>
  );
}
