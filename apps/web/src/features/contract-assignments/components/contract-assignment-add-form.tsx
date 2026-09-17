"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AssignableMemberOption, ContractAssignmentRole } from "../types";
import { CONTRACT_ASSIGNMENT_ROLES } from "../types";
import { formatContractAssignmentRole } from "../utils/assignment-rules";

type ContractAssignmentAddFormProps = {
  members: AssignableMemberOption[];
  isSubmitting: boolean;
  errorMessage: string | null;
  membersErrorMessage: string | null;
  onSubmit: (input: {
    organizationMemberId: string;
    assignmentRole: ContractAssignmentRole;
  }) => Promise<void>;
};

export const ASSIGNABLE_MEMBERS_EMPTY_MESSAGE =
  "Ninguém da sua EMPRESA possui acesso a este Ambiente.";

export function ContractAssignmentAddForm({
  members,
  isSubmitting,
  errorMessage,
  membersErrorMessage,
  onSubmit,
}: ContractAssignmentAddFormProps) {
  const [memberId, setMemberId] = useState<string>("");
  const [role, setRole] = useState<ContractAssignmentRole>("FISCAL");

  async function handleSubmit() {
    if (!memberId) {
      return;
    }

    await onSubmit({
      organizationMemberId: memberId,
      assignmentRole: role,
    });
    setMemberId("");
    setRole("FISCAL");
  }

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          Adicionar responsável da sua EMPRESA
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <p className="text-xs text-muted-foreground">
          Colegas da EMPRESA atuante com acesso a este Ambiente. A responsabilidade no contrato
          (Fiscal, Gerente ou Gestor) não é o papel da EMPRESA no Ambiente.
        </p>
        {membersErrorMessage ? (
          <p className="text-sm text-destructive">{membersErrorMessage}</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">{ASSIGNABLE_MEMBERS_EMPTY_MESSAGE}</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-foreground" htmlFor="assignment-member">
                Pessoa
              </label>
              <Select value={memberId || undefined} onValueChange={setMemberId}>
                <SelectTrigger className="w-full" id="assignment-member">
                  <SelectValue placeholder="Selecione o membro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem
                      key={member.organizationMemberId}
                      value={member.organizationMemberId}
                    >
                      {member.fullName ?? member.organizationMemberId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-[10rem] flex-col gap-1">
              <label className="text-sm font-medium text-foreground" htmlFor="assignment-role">
                Responsabilidade
              </label>
              <Select
                value={role}
                onValueChange={(value) => {
                  setRole(value as ContractAssignmentRole);
                }}
              >
                <SelectTrigger className="w-full" id="assignment-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_ASSIGNMENT_ROLES.map((assignmentRole) => (
                    <SelectItem key={assignmentRole} value={assignmentRole}>
                      {formatContractAssignmentRole(assignmentRole)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={isSubmitting || !memberId}
              type="button"
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        )}
        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      </CardContent>
    </Card>
  );
}
