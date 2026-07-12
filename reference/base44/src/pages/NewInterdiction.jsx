import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const criticalityOptions = [
  {
    value: "Baixa",
    color: "border-slate-200 bg-slate-50 text-slate-700",
    active: "border-slate-500 bg-slate-100 ring-1 ring-slate-500",
  },
  {
    value: "Média",
    color: "border-amber-200 bg-amber-50 text-amber-700",
    active: "border-amber-500 bg-amber-100 ring-1 ring-amber-500",
  },
  {
    value: "Alta",
    color: "border-orange-200 bg-orange-50 text-orange-700",
    active: "border-orange-500 bg-orange-100 ring-1 ring-orange-500",
  },
  {
    value: "Crítica",
    color: "border-red-200 bg-red-50 text-red-700",
    active: "border-red-500 bg-red-100 ring-1 ring-red-500",
  },
];

const notificationRecipients = [
  "Liderança da Contratada",
  "Supervisor HSE",
  "Fiscal do Contrato",
  "Responsável Hydro",
  "Gerência Responsável",
];

function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

export default function NewInterdiction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [form, setForm] = useState({
    area: "",
    location: "",
    company: "",
    activity: "",
    unsafe_condition: "",
    reason: "",
    observations: "",
    criticality: "Média",
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
      );
    }
  }, []);

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setPhotos((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (
      !form.area ||
      !form.company ||
      !form.activity ||
      !form.unsafe_condition ||
      !form.reason
    ) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);

    const user = await base44.auth.me();
    const count = await base44.entities.Interdiction.list(null, 1);
    const number = `PP-${String((count?.length || 0) + 1).padStart(4, "0")}`;

    const data = {
      ...form,
      number,
      photos,
      responsible_name: user.full_name || user.email,
      status: "Paralisação Preventiva",
    };
    if (coords) {
      data.latitude = coords.lat;
      data.longitude = coords.lng;
    }

    const created = await base44.entities.Interdiction.create(data);

    await base44.entities.InterdictionEvent.create({
      interdiction_id: created.id,
      type: "created",
      description: `Paralisação preventiva registrada por ${data.responsible_name}`,
      author_name: data.responsible_name,
    });

    await base44.entities.InterdictionEvent.create({
      interdiction_id: created.id,
      type: "notified",
      description: `Notificações enviadas para: ${notificationRecipients.join(", ")}`,
      author_name: "Sistema",
    });

    await base44.entities.Interdiction.update(created.id, {
      status: "Em Avaliação",
    });

    await base44.entities.Notification.create({
      title: `Paralisação Preventiva: ${form.area} — ${form.company}`,
      area: form.area,
      status: "Em Avaliação",
      priority: form.criticality,
      interdiction_id: created.id,
    });

    setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Atividade Paralisada
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Fluxo de comunicação iniciado automaticamente.
          <br />
          Todos os responsáveis foram notificados.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Ir para Dashboard
          </button>
          <button
            onClick={() => {
              setSuccess(false);
              setForm({
                area: "",
                location: "",
                company: "",
                activity: "",
                unsafe_condition: "",
                reason: "",
                observations: "",
                criticality: "Média",
              });
              setPhotos([]);
            }}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Nova Paralisação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Nova Paralisação Preventiva
          </h1>
          <p className="text-xs text-gray-500">
            Identifique e comunique a condição insegura
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
        <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <p className="text-xs text-blue-700 font-medium">
          Preenchimento otimizado para menos de 60 segundos
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Área *</FieldLabel>
            <input
              value={form.area}
              onChange={(e) => update("area", e.target.value)}
              placeholder="Ex: Caldeiraria"
              className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <FieldLabel>Local</FieldLabel>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Ex: Galpão 3"
              className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Empresa *</FieldLabel>
          <input
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Nome da empresa"
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <FieldLabel>Atividade *</FieldLabel>
          <input
            value={form.activity}
            onChange={(e) => update("activity", e.target.value)}
            placeholder="Atividade sendo realizada"
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <FieldLabel>Condição Insegura *</FieldLabel>
          <textarea
            value={form.unsafe_condition}
            onChange={(e) => update("unsafe_condition", e.target.value)}
            placeholder="Descreva a condição insegura identificada"
            rows={3}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        <div>
          <FieldLabel>Motivo da Paralisação *</FieldLabel>
          <textarea
            value={form.reason}
            onChange={(e) => update("reason", e.target.value)}
            placeholder="Justificativa para paralisar a atividade"
            rows={2}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        <div>
          <FieldLabel>Criticidade *</FieldLabel>
          <div className="grid grid-cols-4 gap-2">
            {criticalityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("criticality", opt.value)}
                className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  form.criticality === opt.value ? opt.active : opt.color
                }`}
              >
                {opt.value}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Fotos</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <div
                key={i}
                className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
              {uploading ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    Adicionar
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div>
          <FieldLabel>Observações</FieldLabel>
          <textarea
            value={form.observations}
            onChange={(e) => update("observations", e.target.value)}
            placeholder="Observações adicionais (opcional)"
            rows={2}
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        {coords && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              Geolocalização capturada: {coords.lat.toFixed(4)},{" "}
              {coords.lng.toFixed(4)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2.5 bg-orange-50 rounded-xl border border-orange-100">
          <Bell className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <p className="text-xs text-orange-700 font-medium">
            Ao confirmar, notificações serão enviadas automaticamente para 5
            responsáveis
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-blue-600 text-white rounded-xl text-base font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Paralisando...
            </span>
          ) : (
            "PARALISAR ATIVIDADE"
          )}
        </button>
      </div>
    </div>
  );
}
