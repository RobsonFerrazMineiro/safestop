"use client";

import type { NotificationFilter } from "../types";
import { NOTIFICATION_FILTER_OPTIONS } from "../types";

type NotificationFiltersProps = {
  activeFilter: NotificationFilter;
  onChange: (filter: NotificationFilter) => void;
};

export function NotificationFilters({ activeFilter, onChange }: NotificationFiltersProps) {
  return (
    <div aria-label="Filtros de notificações" className="flex flex-wrap gap-2" role="tablist">
      {NOTIFICATION_FILTER_OPTIONS.map((option) => {
        const selected = activeFilter === option.id;

        return (
          <button
            key={option.id}
            aria-selected={selected}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              selected
                ? "border-orange-500 bg-orange-500/10 text-orange-200"
                : "border-gray-700 text-gray-300 hover:border-gray-500"
            }`}
            role="tab"
            type="button"
            onClick={() => {
              onChange(option.id);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
