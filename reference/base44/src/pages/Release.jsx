import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Bell, Camera, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Release() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [interdiction, setInterdiction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    base44.entities.Interdiction.get(id)
      .then(setInterdiction)
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleRelease = async () => {
    if (!description.trim()) {
      toast({ title: "Descreva a correção realizada", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const user = await base44.auth.me();
    const now = new Date().toISOString();

    await base44.entities.Interdiction.update(id, {
      status: "Liberada",
      release_photos: photos,
      correction_description: description,
      released_at: now,
    });

    await base44.entities.InterdictionEvent.create({
      interdiction_id: id,
      type: "correction",
      description: `Correção realizada: ${description}`,
      author_name: user.full_name || user.email,
    });

    await base44.entities.InterdictionEvent.create({
      interdiction_id: id,
      type: "released",
      description: `Atividade liberada por ${user.full_name || user.email}`,
      author_name: user.full_name || user.email,
    });

    await base44.entities.Notification.create({
      title: `Atividade liberada: ${interdiction.area} — ${interdiction.company}`,
      area: interdiction.area,
      status: "Liberada",
      priority: interdiction.criticality,
      interdiction_id: id,
    });

    setSuccess(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-7 h-7 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Atividade Liberada
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          A correção foi validada e a ocorrência foi liberada.
          <br />
          Todos os responsáveis foram notificados.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(`/interdiction/${id}`)}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Ver Ocorrência
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Ir para Dashboard
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
          <h1 className="text-lg font-bold text-gray-900">Liberar Atividade</h1>
          <p className="text-xs text-gray-500">
            {interdiction?.number} — {interdiction?.area}
          </p>
        </div>
      </div>

      {interdiction?.photos?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Antes — Evidências da Paralisação
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {interdiction.photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0 border border-gray-100"
              />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Depois — Fotos da Correção
        </p>
        <div className="flex flex-wrap gap-2">
          {photos.map((url, i) => (
            <div
              key={i}
              className="w-24 h-24 rounded-xl overflow-hidden border border-gray-100"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
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

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Descrição da Correção *
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva as ações corretivas realizadas..."
          rows={4}
          className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all resize-none"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
        <Bell className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-xs text-emerald-700 font-medium">
          Ao liberar, todos os responsáveis serão notificados automaticamente
        </p>
      </div>

      <button
        onClick={handleRelease}
        disabled={submitting}
        className="w-full py-4 bg-emerald-600 text-white rounded-xl text-base font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Liberando...
          </span>
        ) : (
          "LIBERAR ATIVIDADE"
        )}
      </button>
    </div>
  );
}
