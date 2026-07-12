import { base44 } from "@/api/base44Client";
import DashboardChart from "@/components/DashboardChart";
import InterdictionCard from "@/components/InterdictionCard";
import {
  AlertOctagon,
  Clock,
  GitBranch,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Timer,
} from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function KpiCard({ icon: Icon, label, value, color, suffix }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900">
            {value}
            {suffix}
          </p>
          <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [interdictions, setInterdictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Interdiction.list("-created_date", 50)
      .then(setInterdictions)
      .finally(() => setLoading(false));
  }, []);

  const preventivas = interdictions.filter(
    (i) => i.status === "Paralisação Preventiva",
  ).length;
  const emAvaliacao = interdictions.filter(
    (i) => i.status === "Em Avaliação",
  ).length;
  const verEAgir = interdictions.filter(
    (i) => i.status === "Ver e Agir",
  ).length;
  const oficiais = interdictions.filter(
    (i) => i.status === "Interdição Oficial",
  ).length;
  const today = moment().startOf("day");
  const liberadasHoje = interdictions.filter(
    (i) =>
      i.status === "Liberada" &&
      i.released_at &&
      moment(i.released_at).isAfter(today),
  ).length;

  const decided = interdictions.filter((i) => i.decision_at);
  let avgResponse = 0;
  if (decided.length > 0) {
    const total = decided.reduce(
      (sum, i) =>
        sum + moment(i.decision_at).diff(moment(i.created_date), "minutes"),
      0,
    );
    avgResponse = Math.round(total / decided.length);
  }

  const released = interdictions.filter(
    (i) => i.status === "Liberada" && i.released_at,
  );
  let avgRelease = 0;
  if (released.length > 0) {
    const total = released.reduce(
      (sum, i) =>
        sum + moment(i.released_at).diff(moment(i.created_date), "hours"),
      0,
    );
    avgRelease = Math.round(total / released.length);
  }

  const recent = interdictions.slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-7 h-7 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  const formatResponseTime = (mins) => {
    if (mins === 0) return "—";
    if (mins < 60) return `${mins}min`;
    return `${Math.round(mins / 60)}h`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              SafeStop
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Visão geral das paralisações preventivas
          </p>
        </div>
        <Link
          to="/new"
          className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Paralisação
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-3 lg:mb-4">
        <KpiCard
          icon={ShieldAlert}
          label="Paralisações Preventivas"
          value={preventivas}
          color="blue"
        />
        <KpiCard
          icon={Clock}
          label="Em Avaliação"
          value={emAvaliacao}
          color="orange"
        />
        <KpiCard
          icon={GitBranch}
          label="Ver e Agir"
          value={verEAgir}
          color="amber"
        />
        <KpiCard
          icon={AlertOctagon}
          label="Interdições Oficiais"
          value={oficiais}
          color="red"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <KpiCard
          icon={ShieldCheck}
          label="Liberadas Hoje"
          value={liberadasHoje}
          color="green"
        />
        <KpiCard
          icon={Timer}
          label="Tempo Médio de Resposta"
          value={formatResponseTime(avgResponse)}
          color="blue"
        />
        <KpiCard
          icon={Clock}
          label="Tempo Médio para Liberação"
          value={avgRelease}
          suffix="h"
          color="gray"
        />
      </div>

      <div className="hidden lg:block mb-8">
        <DashboardChart interdictions={interdictions} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Ocorrências Recentes
          </h2>
          <Link
            to="/interdictions"
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Ver todas
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <ShieldAlert className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              Nenhuma ocorrência registrada
            </p>
            <Link
              to="/new"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Criar primeira paralisação
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {recent.map((item) => (
              <InterdictionCard key={item.id} interdiction={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
