"use client";

import { Button } from "@/components/ui/button";

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
          <Button
            key={option.id}
            aria-selected={selected}
            className="rounded-full"
            role="tab"
            size="sm"
            type="button"
            variant={selected ? "default" : "outline"}
            onClick={() => {
              onChange(option.id);
            }}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
