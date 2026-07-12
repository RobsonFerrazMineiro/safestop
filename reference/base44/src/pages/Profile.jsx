import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Camera, Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cargo: "",
    empresa: "",
    telefone: "",
    foto: "",
  });

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setForm({
        cargo: u.cargo || "",
        empresa: u.empresa || "",
        telefone: u.telefone || "",
        foto: u.foto || "",
      });
      setLoading(false);
    });
  }, []);

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("foto", file_url);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    toast({ title: "Perfil atualizado com sucesso" });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-7 h-7 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors lg:hidden"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Perfil</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
            {form.foto ? (
              <img
                src={form.foto}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-gray-300">
                {(user?.full_name || user?.email || "?")[0].toUpperCase()}
              </span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-gray-800 transition-colors">
            <Camera className="w-3.5 h-3.5 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-base font-semibold text-gray-900 mt-3">
          {user?.full_name || "—"}
        </p>
        <p className="text-xs text-gray-500">{user?.email}</p>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Nome
          </label>
          <input
            value={user?.full_name || ""}
            disabled
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            value={user?.email || ""}
            disabled
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Cargo
          </label>
          <input
            value={form.cargo}
            onChange={(e) => update("cargo", e.target.value)}
            placeholder="Ex: Técnico de Segurança"
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Empresa
          </label>
          <input
            value={form.empresa}
            onChange={(e) => update("empresa", e.target.value)}
            placeholder="Nome da empresa"
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Telefone
          </label>
          <input
            value={form.telefone}
            onChange={(e) => update("telefone", e.target.value)}
            placeholder="(00) 00000-0000"
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            "Salvar Alterações"
          )}
        </button>

        <button
          onClick={() => base44.auth.logout("/")}
          className="w-full py-3.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
