import { base44 } from "@/api/base44Client";
import CriticalityBadge from "@/components/CriticalityBadge";
import OfficialInterdictionCard from "@/components/OfficialInterdictionCard";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Building2,
  Clock,
  GitBranch,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  User,
} from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function InterdictionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [interdiction, setInterdiction] = useState(null);
  const [events, setEvents] = useState([]);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [decisionLoading, setDecisionLoading] = useState(false);

  const loadData = async () => {
    const [item, evts] = await Promise.all([
      base44.entities.Interdiction.get(id),
      base44.entities.InterdictionEvent.filter(
        { interdiction_id: id },
        "-created_date",
        50,
      ),
    ]);
    setInterdiction(item);
    setEvents(evts);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const addComment = async () => {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    const user = await base44.auth.me();
    await base44.entities.InterdictionEvent.create({
      interdiction_id: id,
      type: "comment",
      description: comment,
      author_name: user.full_name || user.email,
    });
    setComment("");
    setSubmittingComment(false);
    loadData();
  };

  const handleDecision = async (decision) => {
    setDecisionLoading(true);
    const user = await base44.auth.me();
    const newStatus =
      decision === "ver_e_agir" ? "Ver e Agir" : "Interdição Oficial";
    const updateData = {
      status: newStatus,
      decision_by: user.full_name || user.email,
      decision_at: new Date().toISOString(),
    };
    if (newStatus === "Interdição Oficial") {
      updateData.mdho_status = "pending";
    }

    await base44.entities.Interdiction.update(id, updateData);

    await base44.entities.InterdictionEvent.create({
      interdiction_id: id,
      type: "decision",
      description: `Decisão da liderança: ${newStatus}`,
      author_name: user.full_name || user.email,
    });

    await base44.entities.Notification.create({
      title: `Decisão: ${newStatus} — ${interdiction.area}`,
      area: interdiction.area,
      status: newStatus,
      priority: interdiction.criticality,
      interdiction_id: id,
    });

    setDecisionLoading(false);
    loadData();
  };

  const handleEncerrar = async () => {
    const user = await base44.auth.me();
    await base44.entities.Interdiction.update(id, { status: "Encerrada" });
    await base44.entities.InterdictionEvent.create({
      interdiction_id: id,
      type: "status_change",
      description: "Ocorrência encerrada",
      author_name: user.full_name || user.email,
    });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-7 h-7 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!interdiction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="text-gray-500">Ocorrência não encontrada.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-sm text-blue-600 font-medium"
        >
          Voltar
        </button>
      </div>
    );
  }

  const showDecision =
    interdiction.status === "Paralisação Preventiva" ||
    interdiction.status === "Em Avaliação";
  const showOfficial = interdiction.status === "Interdição Oficial";
  const showRelease =
    interdiction.status === "Ver e Agir" ||
    interdiction.status === "Interdição Oficial";
  const showEncerrar = interdiction.status === "Liberada";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900">
              {interdiction.number || "—"}
            </h1>
            <StatusBadge status={interdiction.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {interdiction.activity}
          </p>
        </div>
        <CriticalityBadge criticality={interdiction.criticality} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow
            icon={MapPin}
            label="Área"
            value={`${interdiction.area}${interdiction.location ? ` — ${interdiction.location}` : ""}`}
          />
          <InfoRow
            icon={Building2}
            label="Empresa"
            value={interdiction.company}
          />
          <InfoRow
            icon={User}
            label="Responsável"
            value={interdiction.responsible_name || "—"}
          />
          <InfoRow
            icon={Clock}
            label="Abertura"
            value={moment(interdiction.created_date).format("DD/MM/YYYY HH:mm")}
          />
        </div>
        {interdiction.decision_by && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <InfoRow
              icon={GitBranch}
              label="Decisão por"
              value={`${interdiction.decision_by}${interdiction.decision_at ? ` — ${moment(interdiction.decision_at).format("DD/MM HH:mm")}` : ""}`}
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Condição Insegura
          </p>
          <p className="text-sm text-gray-800">
            {interdiction.unsafe_condition}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Motivo
          </p>
          <p className="text-sm text-gray-800">{interdiction.reason}</p>
        </div>
        {interdiction.observations && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Observações
            </p>
            <p className="text-sm text-gray-800">{interdiction.observations}</p>
          </div>
        )}
      </div>

      {interdiction.photos?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Evidências
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {interdiction.photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-xl object-cover flex-shrink-0 border border-gray-100"
              />
            ))}
          </div>
        </div>
      )}

      {showDecision && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-gray-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Decisão da Liderança
            </p>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Avalie a ocorrência e selecione uma das decisões abaixo:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDecision("ver_e_agir")}
              disabled={decisionLoading}
              className="flex flex-col items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <GitBranch className="w-6 h-6" />
              <span className="text-sm font-bold text-center">Ver e Agir</span>
              <span className="text-[10px] text-amber-600 text-center">
                Resolução imediata
              </span>
            </button>
            <button
              onClick={() => handleDecision("interdicao")}
              disabled={decisionLoading}
              className="flex flex-col items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 hover:bg-red-100 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <Lock className="w-6 h-6" />
              <span className="text-sm font-bold text-center">
                Interdição Oficial
              </span>
              <span className="text-[10px] text-red-600 text-center">
                Manter interditada
              </span>
            </button>
          </div>
          {decisionLoading && (
            <div className="flex justify-center mt-3">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      )}

      {showOfficial && (
        <div className="mb-4">
          <OfficialInterdictionCard
            interdiction={interdiction}
            onReload={loadData}
          />
        </div>
      )}

      {showRelease && (
        <div className="mb-4">
          <Link
            to={`/release/${interdiction.id}`}
            className="block w-full py-3.5 bg-emerald-600 text-white rounded-xl text-center text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            LIBERAR ATIVIDADE
          </Link>
        </div>
      )}

      {showEncerrar && (
        <div className="mb-4">
          <button
            onClick={handleEncerrar}
            className="block w-full py-3.5 bg-gray-800 text-white rounded-xl text-center text-sm font-bold hover:bg-gray-900 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            ENCERRAR OCORRÊNCIA
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Linha do Tempo
        </p>
        <Timeline events={events} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Adicionar Comentário
        </p>
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escreva um comentário..."
            className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter") addComment();
            }}
          />
          <button
            onClick={addComment}
            disabled={submittingComment || !comment.trim()}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {submittingComment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
