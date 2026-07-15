import type { UserOrganization } from "../types";

type OrganizationCardProps = {
  organization: UserOrganization;
  isActive?: boolean;
  onSelect: (organizationId: string) => void;
};

export function OrganizationCard({
  organization,
  isActive = false,
  onSelect,
}: OrganizationCardProps) {
  return (
    <button
      className={`flex w-full flex-col gap-2 rounded-lg border px-4 py-4 text-left transition ${
        isActive
          ? "border-orange-500 bg-orange-500/10"
          : "border-gray-700 bg-gray-900 hover:border-gray-500"
      }`}
      onClick={() => {
        onSelect(organization.id);
      }}
      type="button"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-orange-400">
          {organization.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-gray-100">{organization.name}</span>
          {organization.code ? (
            <span className="text-xs text-gray-400">{organization.code}</span>
          ) : null}
          <span className="break-all font-mono text-xs text-gray-500">{organization.id}</span>
        </div>
      </div>
      <span className="text-xs uppercase tracking-wide text-gray-500">
        {organization.organizationType}
      </span>
    </button>
  );
}
