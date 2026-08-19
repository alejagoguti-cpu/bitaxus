/* Bitaxus editorial fintech: operaciones claras, tarjetas suaves y coral propietario. */
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownLeft, ArrowLeftRight, ArrowRight, ArrowUpRight, Bell, Building2,
  ChevronDown, ChevronRight, CircleHelp, ClipboardList, Globe2, Home as HomeIcon,
  Landmark, LayoutGrid, Menu, MoreHorizontal, PanelLeft, Plus, Settings,
  UsersRound, WalletCards, X, CheckCircle2, Clock3, AlertCircle, Info, UserRound
} from "lucide-react";

const nav = [
  [HomeIcon, "Inicio"], [ArrowDownLeft, "Recaudos"], [ArrowLeftRight, "Pagos y dispersiones"],
  [UsersRound, "Contrapartes"], [Globe2, "Bitaxus Global"], [LayoutGrid, "Reportes"], [Settings, "Configuración"]
] as const;

const activity = [
  { icon: ArrowDownLeft, tone: "green", title: "Recaudo identificado", subtitle: "Juan Perez", ref: "Referencia #RC-12984", time: "Hoy, 9:30 a. m.", amount: "$ 1.250.000", status: "CONFIRMADO" },
  { icon: ArrowUpRight, tone: "coral", title: "Pago programado", subtitle: "Proveedor Tech", ref: "Referencia #PA-SS21", time: "Ayer, 4:10 p. m.", amount: "$ 850.000", status: "EN PROCESO" },
  { icon: Globe2, tone: "purple", title: "Operación Global", subtitle: "USD → COP", ref: "Referencia #QG-24871", time: "Ayer, 2:40 p. m.", amount: "$ 3.912.000", status: "CONFIRMADO" },
  { icon: UsersRound, tone: "blue", title: "Dispersión procesada", subtitle: "Equipo comercial (12 beneficiarios)", ref: "Referencia #DS-96541", time: "Ayer, 12:20 p. m.", amount: "$ 7.500.000", status: "PROCESADA" },
];

function Icon({ icon: IconComp, tone = "slate" }: { icon: any; tone?: string }) {
  return <span className={`icon-bubble ${tone}`}><IconComp size={15} strokeWidth={2.1} /></span>;
}

export default function Home() {
  const [active, setActive] = useState("Inicio");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("Este mes");
  const [company, setCompany] = useState("OnTarget SAS");

  const quickAction = (message: string) => toast(message, { description: "La acción está lista para continuar.", duration: 2200 });

  return (
    <div className="app-shell" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/bitaxus-texture.webp)` }}>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand"><img src={`${import.meta.env.BASE_URL}assets/bitaxus-mark.webp`} alt="" /><span>BITAXUS</span></div>
        <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú"><X size={18} /></button>
        <nav className="nav-list" aria-label="Navegación principal">
          {nav.map(([IconComp, label]) => <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => { setActive(label); setSidebarOpen(false); }}>{<IconComp size={15} />}{label}</button>)}
        </nav>
        <div className="agent-card"><div className="agent-head"><span className="agent-icon"><ClipboardList size={14}/></span><b>Agente Bitaxus</b></div><p>¿Necesitas ayuda con una operación?</p><button onClick={() => quickAction("Chat del agente abierto")}>Abrir chat <ArrowRight size={13}/></button></div>
      </aside>
      {sidebarOpen && <button className="backdrop" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú" />}
      <main className="main-content">
        <header className="topbar"><button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><Menu size={20}/></button><div><h1>Hola, Alejandra</h1><p>Este es el estado de tu operación.</p></div><div className="top-actions"><label className="select-wrap"><Building2 size={13}/><select value={company} onChange={e => setCompany(e.target.value)}><option>OnTarget SAS</option><option>Andina Corp.</option><option>Beta Holdings</option></select><ChevronDown size={12}/></label><label className="select-wrap"><ClipboardList size={13}/><select value={period} onChange={e => setPeriod(e.target.value)}><option>Este mes</option><option>Últimos 30 días</option><option>Este trimestre</option></select><ChevronDown size={12}/></label><button className="icon-button notification" onClick={() => quickAction("No tienes notificaciones nuevas")} aria-label="Notificaciones"><Bell size={16}/><i>3</i></button><button className="avatar" onClick={() => quickAction("Perfil de Alejandra")}>A</button><ChevronDown size={13} className="avatar-chevron" /></div></header>
        <section className="summary-card panel"><div className="summary-head"><div><p className="eyebrow">Actividad del periodo</p><div className="total">$ 2.560.000 <small>COP</small></div><p className="positive"><ArrowUpRight size={13}/> 12,5% <span>vs. 1–30 de abril de 2025</span></p></div><button className="hide-button" onClick={() => quickAction("Resumen ocultado temporalmente")}><Info size={12}/> Ocultar</button></div><div className="metrics"><div className="metric"><Icon icon={ArrowDownLeft} tone="green"/><div><span>Entradas</span><b>$ 1.550.000 <small>COP</small></b><em>+6,3% <i>vs. periodo anterior</i></em></div></div><div className="metric"><Icon icon={ArrowUpRight} tone="coral"/><div><span>Salidas</span><b>$ 1.020.000 <small>COP</small></b><em className="red">+4,1% <i>vs. periodo anterior</i></em></div></div><div className="metric"><Icon icon={Clock3} tone="amber"/><div><span>En proceso</span><b>12 <small>OPERACIONES</small></b><p>Operaciones pendientes de confirmación</p></div></div></div></section>
        <section className="quick-actions"><button onClick={() => quickAction("Programar recaudo") }><Icon icon={Plus} tone="green"/><b>Programar recaudo</b><ChevronRight size={15}/></button><button onClick={() => quickAction("Programar pago") }><Icon icon={ArrowUpRight} tone="blue"/><b>Programar pago</b><ChevronRight size={15}/></button><button onClick={() => quickAction("Consulta global") }><Icon icon={Globe2} tone="purple"/><b>Consultar en Global</b><ChevronRight size={15}/></button></section>
        <section className="lower-grid"><div className="panel activity-card"><div className="card-heading"><h2>Actividad reciente</h2><button aria-label="Expandir actividad"><ChevronDown size={15}/></button></div><div className="activity-list">{activity.map((item) => <button className="activity-row" key={item.title} onClick={() => quickAction(item.title)}><Icon icon={item.icon} tone={item.tone}/><div className="activity-main"><b>{item.title}</b><span>{item.subtitle}</span></div><div className="activity-ref"><span>{item.ref}</span><span>{item.time}</span></div><div className="activity-amount"><b className={item.status === "CONFIRMADO" ? "money-green" : ""}>{item.amount}</b><span className={`status ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span></div><ChevronRight size={14}/></button>)}</div><button className="view-all" onClick={() => quickAction("Mostrando todas las operaciones")}>Ver todas las operaciones <ArrowRight size={14}/></button></div>
          <div className="panel review-card"><div className="card-heading"><h2>Por revisar <span className="count">4</span></h2><button aria-label="Expandir pendientes"><ChevronDown size={15}/></button></div><div className="review-list"><button onClick={() => quickAction("Revisando pagos pendientes")}><Icon icon={ArrowLeftRight} tone="coral"/><div><b>2 pagos pendientes</b><span>Espera tu aprobación para continuar.</span></div><strong>2</strong><ChevronRight size={14}/></button><button onClick={() => quickAction("Revisando recaudo")}><Icon icon={Clock3} tone="amber"/><div><b>1 recaudo sin relacionar</b><span>Hay pagos pendientes de ser identificados.</span></div><strong className="amber-text">1</strong><ChevronRight size={14}/></button><button onClick={() => quickAction("Revisando beneficiario")}><Icon icon={Info} tone="blue"/><div><b>1 beneficiario incompleto</b><span>Completa los datos para operar.</span></div><strong className="blue-text">1</strong><ChevronRight size={14}/></button></div><button className="view-all" onClick={() => quickAction("Mostrando todas las revisiones")}>Ver todas las operaciones <ArrowRight size={14}/></button></div></section>
      </main>
    </div>
  );
}
