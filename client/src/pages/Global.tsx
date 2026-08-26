import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowRight, ArrowUpRight, CheckCircle2, ChevronRight, Download, Globe2, Info, LoaderCircle, RefreshCw, Search, Send, Star, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import HorizontalScrollHint from "../components/HorizontalScrollHint";
import { useGlobalOperationsSupabase, type GlobalOperationInput, type GlobalOperationStatus, type GlobalOperationType } from "../hooks/useGlobalSupabase";

const money = (value: number, currency: string) => new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const dateLabel = (value: string) => new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
const FAVORITE_CURRENCIES_KEY = "bitaxus-global-favorite-currencies";
const GLOBAL_CURRENCY_PAIR_KEY = "bitaxus-global-currency-pair";

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
type CurrencyPickerTarget = "Origen" | "Destino";
type CurrencyPair = { source: string; target: string };
type ReferenceQuote = { base: string; quote: string; rate: number; date: string };

const rateLabel = (value: number) => new Intl.NumberFormat("es-CO", { maximumSignificantDigits: 7 }).format(value);

function getSavedFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITE_CURRENCIES_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === "string" && GLOBAL_CURRENCIES.some(currency => currency.code === code)) : [];
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
  const [currencyAction, setCurrencyAction] = useState<CurrencyPickerTarget | null>(null);
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string | null>(null);
  const [favoriteCodes, setFavoriteCodes] = useState<string[]>(getSavedFavorites);
  const [currencyPair, setCurrencyPair] = useState<CurrencyPair>(getSavedCurrencyPair);
  const [referenceQuote, setReferenceQuote] = useState<ReferenceQuote | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<"loading" | "ready" | "error">("loading");
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

  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const open = (type: GlobalOperationType, sourceCode = form.source_currency, targetCode = form.target_currency) => {
    setModal(type);
    update("source_currency", sourceCode);
    if (type === "Conversión") update("target_currency", targetCode === sourceCode ? GLOBAL_CURRENCIES.find(currency => currency.code !== sourceCode)?.code ?? "USD" : targetCode);
    update("source_amount", "");
    update("target_amount", "");
    update("exchange_rate", type === "Conversión" && referenceQuote?.base === sourceCode && referenceQuote.quote === targetCode ? String(referenceQuote.rate) : "");
    update("description", "");
  };

  const availableCurrencies = useMemo(() => {
    const normalizedQuery = currencyQuery.trim().toLocaleLowerCase("es-CO");
    return GLOBAL_CURRENCIES
      .filter(currency => `${currency.code} ${currency.name}`.toLocaleLowerCase("es-CO").includes(normalizedQuery))
      .sort((left, right) => Number(favoriteCodes.includes(right.code)) - Number(favoriteCodes.includes(left.code)) || left.code.localeCompare(right.code));
  }, [currencyQuery, favoriteCodes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITE_CURRENCIES_KEY, JSON.stringify(favoriteCodes));
    } catch {
      // La selección se mantiene durante la sesión si el navegador no permite persistencia local.
    }
  }, [favoriteCodes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(GLOBAL_CURRENCY_PAIR_KEY, JSON.stringify(currencyPair));
    } catch {
      // El par se conserva durante la sesión si el navegador no permite persistencia local.
    }
  }, [currencyPair]);

  useEffect(() => {
    let active = true;
    setQuoteStatus("loading");
    setReferenceQuote(null);
    fetch(`https://api.frankfurter.dev/v2/rate/${sourceCurrency.code}/${targetCurrency.code}`)
      .then(async response => {
        if (!response.ok) throw new Error(`No se pudo consultar la cotización (${response.status}).`);
        return response.json() as Promise<ReferenceQuote>;
      })
      .then(quote => {
        if (!active || !Number.isFinite(quote.rate) || quote.base !== sourceCurrency.code || quote.quote !== targetCurrency.code) return;
        setReferenceQuote(quote);
        setQuoteStatus("ready");
      })
      .catch(() => {
        if (active) setQuoteStatus("error");
      });
    return () => { active = false; };
  }, [sourceCurrency.code, targetCurrency.code, quoteRefreshKey]);

  const openCurrencyPicker = (target: CurrencyPickerTarget) => {
    setCurrencyAction(target);
    setCurrencyQuery("");
    setSelectedCurrencyCode(null);
  };

  const toggleFavorite = (code: string) => setFavoriteCodes(current => current.includes(code) ? current.filter(item => item !== code) : [...current, code]);

  const chooseCurrency = (currency: GlobalCurrency) => {
    if (!currencyAction || selectedCurrencyCode) return;
    const pickerTarget = currencyAction;
    setSelectedCurrencyCode(currency.code);
    window.setTimeout(() => {
      setCurrencyPair(current => {
        if (pickerTarget === "Origen") return currency.code === current.target ? { source: currency.code, target: current.source } : { ...current, source: currency.code };
        return currency.code === current.source ? { source: current.target, target: currency.code } : { ...current, target: currency.code };
      });
      setCurrencyAction(null);
      setCurrencyQuery("");
      setSelectedCurrencyCode(null);
    }, 180);
  };

  const submit = () => {
    if (!modal) return;
    const input: GlobalOperationInput = {
      operation_type: modal,
      source_currency: form.source_currency,
      target_currency: modal === "Conversión" ? form.target_currency : undefined,
      source_amount: Number(form.source_amount),
      target_amount: modal === "Conversión" ? Number(form.target_amount) : undefined,
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
    if ((!modal && !currencyAction) || createOperation.isPending) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
        setCurrencyAction(null);
        setSelectedCurrencyCode(null);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [modal, currencyAction, createOperation.isPending]);

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
          <h3 className="global-section-title">Disponible para operar <Info size={14} /></h3>
          <div className="balance-grid">
            <article className="balance-card cop currency-balance-card">
              <div className="balance-icon" aria-hidden="true">{sourceCurrency.flag}</div><span>{sourceCurrency.name}</span><strong>{money(balances[sourceCurrency.code] ?? 0, sourceCurrency.code)}</strong><small>{sourceCurrency.code} · Origen</small>
            </article>
            <article className="balance-card currency-config-card">
              <div className="currency-pair-heading"><span>Par de monedas</span><strong>{sourceCurrency.code} <ArrowRight size={17} /> {targetCurrency.code}</strong></div>
              <div className="currency-pair-controls"><button className="configure-currency" type="button" onClick={() => openCurrencyPicker("Origen")}><span aria-hidden="true" className="currency-flag">{sourceCurrency.flag}</span><span><small>Origen</small><b>{sourceCurrency.code}</b></span><ChevronRight size={15} /></button><button className="configure-currency" type="button" onClick={() => openCurrencyPicker("Destino")}><span aria-hidden="true" className="currency-flag">{targetCurrency.flag}</span><span><small>Destino</small><b>{targetCurrency.code}</b></span><ChevronRight size={15} /></button></div>
              <section className={`reference-quote ${quoteStatus}`} aria-live="polite"><span>Cotización de referencia actual</span>{quoteStatus === "loading" && <b><LoaderCircle size={14} className="spin" /> Consultando tasa…</b>}{quoteStatus === "ready" && referenceQuote && <><b>1 {sourceCurrency.code} = {rateLabel(referenceQuote.rate)} {targetCurrency.code}</b><small>Última tasa publicada · {dateLabel(referenceQuote.date)} · Frankfurter</small></>}{quoteStatus === "error" && <b>No se pudo consultar la tasa para este par.</b>}<button type="button" onClick={() => setQuoteRefreshKey(value => value + 1)} aria-label={quoteStatus === "loading" ? "Actualizando cotización de referencia" : "Actualizar cotización de referencia"} aria-busy={quoteStatus === "loading"} disabled={quoteStatus === "loading"}>{quoteStatus === "loading" ? <><LoaderCircle size={13} className="spin" /> Actualizando…</> : <><RefreshCw size={13} /> Actualizar</>}</button></section>
              <div className="balance-actions" aria-label={`Operaciones desde ${sourceCurrency.code} hacia ${targetCurrency.code}`}><button onClick={() => open("Recepción", targetCurrency.code)}><ArrowDownLeft size={15} /> Recibir</button><button onClick={() => open("Conversión", sourceCurrency.code, targetCurrency.code)}><ArrowLeftRight size={15} /> Convertir</button><button onClick={() => open("Dispersión", sourceCurrency.code)}><Send size={15} /> Dispersar</button></div>
            </article>
            <article className="balance-card usd currency-balance-card">
              <div className="balance-icon" aria-hidden="true">{targetCurrency.flag}</div><span>{targetCurrency.name}</span><strong>{money(balances[targetCurrency.code] ?? 0, targetCurrency.code)}</strong><small>{targetCurrency.code} · Destino</small>
            </article>
          </div>

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

      {currencyAction && <div className="modal-backdrop global-currency-backdrop" onClick={() => { if (!selectedCurrencyCode) setCurrencyAction(null); }}><section className="action-modal global-currency-modal" role="dialog" aria-modal="true" aria-labelledby="global-currency-title" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => { if (!selectedCurrencyCode) setCurrencyAction(null); }} aria-label="Cerrar selector de moneda"><X size={17} /></button><div className="modal-icon"><Globe2 size={17} /></div><h2 id="global-currency-title">Elige moneda de {currencyAction.toLocaleLowerCase("es-CO")}</h2><p>Esta elección actualiza la tarjeta de {currencyAction.toLocaleLowerCase("es-CO")} y la cotización de referencia. Hay {GLOBAL_CURRENCIES.length} opciones disponibles.</p><label className="global-currency-search"><Search size={16} /><input autoFocus value={currencyQuery} onChange={event => setCurrencyQuery(event.target.value)} placeholder="Buscar por nombre o código" aria-label="Buscar moneda" /></label><div className="global-currency-list" role="listbox" aria-label="Monedas disponibles">{availableCurrencies.map(currency => { const isFavorite = favoriteCodes.includes(currency.code); const isSelected = selectedCurrencyCode === currency.code; const isCurrent = (currencyAction === "Origen" ? sourceCurrency.code : targetCurrency.code) === currency.code; const hasBalance = Object.hasOwn(balances, currency.code); return <div className={`global-currency-option${isCurrent ? " is-current" : ""}${isSelected ? " is-selected" : ""}`} key={currency.code} role="option" aria-selected={isSelected}><button className="global-currency-choice" type="button" onClick={() => chooseCurrency(currency)} disabled={Boolean(selectedCurrencyCode)}><span className="currency-symbol" aria-hidden="true">{currency.flag}</span><span><b>{currency.code}{isCurrent ? " · Seleccionada" : ""}</b><small>{currency.name}</small><em>{hasBalance ? `Saldo disponible · ${money(balances[currency.code], currency.code)}` : "Sin saldo operativo registrado"}</em></span>{isSelected ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}</button><button className={`currency-favorite${isFavorite ? " is-favorite" : ""}`} type="button" aria-pressed={isFavorite} aria-label={`${isFavorite ? "Quitar" : "Marcar"} ${currency.code} como favorita`} onClick={() => toggleFavorite(currency.code)}><Star size={15} fill={isFavorite ? "currentColor" : "none"} /></button></div>; })}{availableCurrencies.length === 0 && <p className="global-currency-empty">No se encontró una moneda con esa búsqueda.</p>}</div>{selectedCurrencyCode && <p className="global-currency-selection-status" role="status">Moneda seleccionada. Actualizando {currencyAction.toLocaleLowerCase("es-CO")}…</p>}</section></div>}

      {modal && <div className="modal-backdrop" onClick={() => !createOperation.isPending && setModal(null)}><div className="action-modal global-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => !createOperation.isPending && setModal(null)} aria-label="Cerrar"><X size={17} /></button><div className="modal-icon"><Globe2 size={17} /></div><h2>{modal}</h2><p>Registra la operación para conservar trazabilidad financiera.</p>{modal === "Conversión" && <div className="global-form-grid"><label>Moneda origen<select value={form.source_currency} onChange={event => update("source_currency", event.target.value)}>{GLOBAL_CURRENCIES.map(currency => <option key={currency.code} value={currency.code}>{currency.code} · {currency.name}</option>)}</select></label><label>Moneda destino<select value={form.target_currency} onChange={event => update("target_currency", event.target.value)}>{GLOBAL_CURRENCIES.filter(currency => currency.code !== form.source_currency).map(currency => <option key={currency.code} value={currency.code}>{currency.code} · {currency.name}</option>)}</select></label></div>}{modal !== "Conversión" && <div className="global-selected-currency"><span>Moneda de operación</span><b>{form.source_currency} · {GLOBAL_CURRENCIES.find(currency => currency.code === form.source_currency)?.name ?? form.source_currency}</b><button type="button" onClick={() => { const pickerTarget = modal === "Recepción" ? "Destino" : "Origen"; setModal(null); openCurrencyPicker(pickerTarget); }}>Cambiar</button></div>}<label>Valor<em>*</em><input type="number" min="0.01" value={form.source_amount} onChange={event => update("source_amount", event.target.value)} placeholder="0.00" /></label>{modal === "Conversión" && <div className="global-form-grid"><label>Valor destino<em>*</em><input type="number" min="0.01" value={form.target_amount} onChange={event => update("target_amount", event.target.value)} placeholder="0.00" /></label><label>Tasa<em>*</em><input type="number" min="0.00000001" value={form.exchange_rate} onChange={event => update("exchange_rate", event.target.value)} placeholder="0.00" /></label></div>}<label>Cuenta<input value={form.account} onChange={event => update("account", event.target.value)} placeholder="Cuenta de origen o destino" /></label><label>Contraparte<input value={form.counterparty} onChange={event => update("counterparty", event.target.value)} placeholder="Nombre de la contraparte" /></label><label>Referencia<input value={form.reference} onChange={event => update("reference", event.target.value)} placeholder="Referencia interna" /></label><label>Fecha<em>*</em><input type="date" value={form.operation_date} onChange={event => update("operation_date", event.target.value)} /></label><label>Descripción<textarea value={form.description} onChange={event => update("description", event.target.value)} placeholder="Información adicional (opcional)" /></label><div className="modal-actions"><button className="secondary-action" onClick={() => setModal(null)}>Cancelar</button><button className="primary-action" onClick={submit} disabled={disabled}>{createOperation.isPending ? <><LoaderCircle size={14} className="spin" /> Guardando...</> : "Guardar operación"}</button></div></div></div>}
    </section>
  );
}
