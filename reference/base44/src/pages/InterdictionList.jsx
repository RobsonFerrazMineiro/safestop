import { base44 } from "@/api/base44Client";
import InterdictionCard from "@/components/InterdictionCard";
import { ArrowLeft, Filter, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const statusOptions = [
  "Todos",
  "Paralisação Preventiva",
  "Em Avaliação",
  "Ver e Agir",
  "Interdição Oficial",
  "Liberada",
  "Encerrada",
];

export default function InterdictionList() {
  const navigate = useNavigate();
  const [interdictions, setInterdictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.entities.Interdiction.list("-created_date", 100)
      .then(setInterdictions)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = interdictions;
    if (statusFilter !== "Todos") {
      result = result.filter((i) => i.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          (i.area || "").toLowerCase().includes(q) ||
          (i.company || "").toLowerCase().includes(q) ||
          (i.activity || "").toLowerCase().includes(q) ||
          (i.number || "").toLowerCase().includes(q) ||
          (i.responsible_name || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [interdictions, statusFilter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-7 h-7 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors lg:hidden"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Ocorrências</h1>
          <p className="text-xs text-gray-500">{filtered.length} registros</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          {showFilters ? (
            <X className="w-4 h-4 text-gray-600" />
          ) : (
            <Filter className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por área, empresa, atividade..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
        />
      </div>

      {showFilters && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  statusFilter === opt
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-500">
            Nenhuma ocorrência encontrada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <InterdictionCard key={item.id} interdiction={item} />
          ))}
        </div>
      )}
    </div>
  );
}
