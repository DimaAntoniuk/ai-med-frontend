import { useCallback, useEffect, useState } from "react";
import {
  TeamApiError,
  teamApi,
  type MemberDto,
  type MemberRole,
  type MemberStatus,
  type SubscriptionDto,
} from "../api/team";
import { Badge } from "../design/data/Badge";
import { Card } from "../design/data/Card";
import { Table } from "../design/data/Table";
import { Tabs } from "../design/data/Tabs";
import { Alert } from "../design/feedback/Alert";
import { Dialog } from "../design/feedback/Dialog";
import { Button } from "../design/forms/Button";
import { RadioGroup } from "../design/forms/Checkbox";
import { Input } from "../design/forms/Input";
import { Select } from "../design/forms/Select";
import { useSettings } from "../i18n";
import type { MessageKey } from "../i18n/strings";
import { formatDateTime } from "./billingFormat";

const ROLES: MemberRole[] = ["owner", "admin", "clinician"];

const ROLE_NAME: Record<MemberRole, MessageKey> = {
  owner: "team.role.owner",
  admin: "team.role.admin",
  clinician: "team.role.clinician",
};

const ROLE_DESC: Record<MemberRole, MessageKey> = {
  owner: "team.role.owner.desc",
  admin: "team.role.admin.desc",
  clinician: "team.role.clinician.desc",
};

const STATUS_NAME: Record<MemberStatus, MessageKey> = {
  active: "team.status.active",
  invited: "team.status.invited",
  suspended: "team.status.suspended",
};

const STATUS_TONE: Record<MemberStatus, "success" | "warning" | "neutral"> = {
  active: "success",
  invited: "warning",
  suspended: "neutral",
};

type Filter = "all" | MemberStatus;

/** Invited members have no name yet — the address stands in for them. */
function displayName(member: MemberDto): string {
  return member.name || member.email.split("@")[0];
}

/**
 * Team member management for the shared subscription: who holds a seat, what
 * they may do, and the invitations still outstanding. Every seat-consuming
 * action is checked against the subscription, so running out of seats sends
 * the reader to billing rather than failing silently.
 */
export function TeamScreen({
  currentEmail,
  onManageSeats,
}: {
  currentEmail: string | null;
  onManageSeats: () => void;
}) {
  const { t, locale } = useSettings();
  const [members, setMembers] = useState<MemberDto[] | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDto | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("clinician");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberDto | null>(null);
  const [removing, setRemoving] = useState(false);

  const describe = useCallback(
    (e: unknown) => (e instanceof TeamApiError ? t(e.key, e.params) : t("error.generic")),
    [t],
  );

  /** Members and the subscription move together — a seat count is only true of both. */
  const reload = useCallback(async () => {
    const [nextMembers, nextSubscription] = await Promise.all([
      teamApi.listMembers(),
      teamApi.getSubscription(),
    ]);
    setMembers(nextMembers);
    setSubscription(nextSubscription);
  }, []);

  useEffect(() => {
    let live = true;
    teamApi
      .listMembers()
      .then((list) => live && setMembers(list))
      .catch((e) => live && setError(describe(e)));
    teamApi
      .getSubscription()
      .then((sub) => live && setSubscription(sub))
      .catch((e) => live && setError(describe(e)));
    return () => {
      live = false;
    };
  }, [describe]);

  if (!members || !subscription) {
    return (
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
        {t("team.loading")}
      </span>
    );
  }

  const freeSeats = Math.max(subscription.seats_total - subscription.seats_used, 0);
  const counts: Record<Filter, number> = {
    all: members.length,
    active: members.filter((m) => m.status === "active").length,
    invited: members.filter((m) => m.status === "invited").length,
    suspended: members.filter((m) => m.status === "suspended").length,
  };
  const visible = filter === "all" ? members : members.filter((m) => m.status === filter);

  const run = async (id: string, action: () => Promise<void>) => {
    setPendingId(id);
    setError(null);
    setNotice(null);
    try {
      await action();
      await reload();
    } catch (e) {
      setError(describe(e));
      // The optimistic role change below is reverted by re-reading the truth.
      await reload().catch(() => {});
    } finally {
      setPendingId(null);
    }
  };

  const changeRole = (member: MemberDto, role: MemberRole) => {
    setMembers((prev) => prev?.map((m) => (m.id === member.id ? { ...m, role } : m)) ?? prev);
    return run(member.id, async () => {
      await teamApi.updateMemberRole(member.id, role);
    });
  };

  const setStatus = (member: MemberDto, status: "active" | "suspended") =>
    run(member.id, async () => {
      await teamApi.setMemberStatus(member.id, status);
      setNotice(
        t(status === "suspended" ? "team.suspended" : "team.reactivated", {
          name: displayName(member),
        }),
      );
    });

  const resend = (member: MemberDto) =>
    run(member.id, async () => {
      await teamApi.resendInvite(member.id);
      setNotice(t("team.resent", { email: member.email }));
    });

  const sendInvite = async () => {
    setInviting(true);
    setInviteError(null);
    try {
      const member = await teamApi.inviteMember(inviteEmail, inviteRole);
      await reload();
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("clinician");
      setNotice(t("team.invite.sent", { email: member.email }));
    } catch (e) {
      setInviteError(describe(e));
    } finally {
      setInviting(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    setError(null);
    try {
      await teamApi.removeMember(removeTarget.id);
      await reload();
      setNotice(t("team.removed", { name: displayName(removeTarget) }));
      setRemoveTarget(null);
    } catch (e) {
      setError(describe(e));
      setRemoveTarget(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {error && (
        <Alert tone="critical" title={t("error.title")} onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {freeSeats === 0 && (
        <Alert
          tone="warning"
          title={t("team.seats.full.title", { total: subscription.seats_total })}
          action={
            <Button size="sm" variant="secondary" onClick={onManageSeats}>
              {t("team.seats.add")}
            </Button>
          }
        >
          {t("team.seats.full.body")}
        </Alert>
      )}

      <Card
        title={t("team.title")}
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
              {t("team.seats.summary", {
                used: subscription.seats_used,
                total: subscription.seats_total,
              })}
            </span>
            <Button
              size="sm"
              variant="primary"
              disabled={freeSeats === 0}
              onClick={() => {
                setInviteError(null);
                setInviteOpen(true);
              }}
              icon={<span aria-hidden="true">+</span>}
            >
              {t("team.invite")}
            </Button>
          </div>
        }
        footer={
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
            {t("team.backendNote")}
          </span>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Tabs
            value={filter}
            onChange={(value: string) => setFilter(value as Filter)}
            tabs={[
              { value: "all", label: t("team.tab.all"), count: counts.all },
              { value: "active", label: t("team.tab.active"), count: counts.active },
              { value: "invited", label: t("team.tab.invited"), count: counts.invited },
              { value: "suspended", label: t("team.tab.suspended"), count: counts.suspended },
            ]}
          />

          {visible.length === 0 ? (
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
              {t("team.empty")}
            </span>
          ) : (
            <Table
            columns={[
              {
                key: "member",
                label: t("team.col.member"),
                render: (row: MemberDto) => (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: "var(--weight-semibold)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {displayName(row)}
                      {currentEmail && row.email.toLowerCase() === currentEmail.toLowerCase() && (
                        <Badge tone="primary">{t("team.you")}</Badge>
                      )}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                      {row.email}
                    </span>
                  </div>
                ),
              },
              {
                key: "role",
                label: t("team.col.role"),
                nowrap: true,
                render: (row: MemberDto) => (
                  <Select
                    value={row.role}
                    disabled={pendingId === row.id || row.status === "suspended"}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      changeRole(row, e.target.value as MemberRole)
                    }
                    options={ROLES.map((role) => ({ value: role, label: t(ROLE_NAME[role]) }))}
                    style={{ minWidth: 148 }}
                  />
                ),
              },
              {
                key: "status",
                label: t("team.col.status"),
                nowrap: true,
                render: (row: MemberDto) => (
                  <Badge tone={STATUS_TONE[row.status]} dot>
                    {t(STATUS_NAME[row.status])}
                  </Badge>
                ),
              },
              {
                key: "last_active_at",
                label: t("team.col.lastActive"),
                nowrap: true,
                render: (row: MemberDto) =>
                  row.last_active_at ? (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
                      {formatDateTime(row.last_active_at, locale)}
                    </span>
                  ) : (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                      {t("team.lastActive.never")}
                    </span>
                  ),
              },
              {
                key: "actions",
                label: t("team.col.actions"),
                align: "right",
                nowrap: true,
                render: (row: MemberDto) => (
                  <div style={{ display: "inline-flex", gap: 4 }}>
                    {row.status === "invited" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pendingId === row.id}
                        onClick={() => resend(row)}
                      >
                        {t("team.resend")}
                      </Button>
                    )}
                    {row.status === "active" && row.role !== "owner" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pendingId === row.id}
                        onClick={() => setStatus(row, "suspended")}
                      >
                        {t("team.suspend")}
                      </Button>
                    )}
                    {row.status === "suspended" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pendingId === row.id || freeSeats === 0}
                        onClick={() => setStatus(row, "active")}
                      >
                        {t("team.reactivate")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pendingId === row.id}
                      onClick={() => setRemoveTarget(row)}
                    >
                      {t("team.remove")}
                    </Button>
                  </div>
                ),
              },
            ]}
              rows={visible}
            />
          )}
        </div>
      </Card>

      <Dialog
        open={inviteOpen}
        title={t("team.invite.title")}
        subtitle={t("team.invite.subtitle")}
        width={520}
        onClose={inviting ? undefined : () => setInviteOpen(false)}
        footer={
          <>
            <Button variant="ghost" disabled={inviting} onClick={() => setInviteOpen(false)}>
              {t("billing.close")}
            </Button>
            <Button
              variant="primary"
              disabled={inviting || inviteEmail.trim() === ""}
              onClick={sendInvite}
            >
              {inviting ? t("team.invite.sending") : t("team.invite.send")}
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {inviteError && <Alert tone="critical">{inviteError}</Alert>}
          <Input
            label={t("team.invite.email")}
            type="email"
            required
            placeholder="doctor@clinic.example"
            hint={t("team.invite.seatNote", { count: freeSeats })}
            value={inviteEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--text-secondary)",
              }}
            >
              {t("team.invite.role")}
            </span>
            <RadioGroup
              name="invite-role"
              value={inviteRole}
              onChange={(value: string) => setInviteRole(value as MemberRole)}
              options={ROLES.map((role) => ({
                value: role,
                label: t(ROLE_NAME[role]),
                description: t(ROLE_DESC[role]),
              }))}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={removeTarget !== null}
        title={t("team.remove.title", { name: removeTarget ? displayName(removeTarget) : "" })}
        width={440}
        onClose={removing ? undefined : () => setRemoveTarget(null)}
        footer={
          <>
            <Button variant="ghost" disabled={removing} onClick={() => setRemoveTarget(null)}>
              {t("billing.close")}
            </Button>
            <Button variant="destructive" disabled={removing} onClick={confirmRemove}>
              {t("team.remove.confirm")}
            </Button>
          </>
        }
      >
        <span style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
          {t("team.remove.body")}
        </span>
      </Dialog>
    </div>
  );
}
