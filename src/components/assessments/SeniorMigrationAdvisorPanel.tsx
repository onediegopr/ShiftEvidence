"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Archive,
  Brain,
  Check,
  CircleHelp,
  ClipboardList,
  Lock,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import {
  requestSeniorAdvisorCreditsAction,
  sendSeniorAdvisorMessageAction,
} from "../../app/dashboard/assessments/[id]/advisor/actions";
import {
  archiveAdvisorMemoryItemAction,
  confirmAdvisorMemoryItemAction,
  createAdvisorMemoryItemAction,
  listAdvisorMemoryItemsAction,
  rejectAdvisorMemoryItemAction,
  resolveAdvisorMemoryItemAction,
  supersedeAdvisorMemoryItemAction,
} from "../../app/dashboard/assessments/[id]/advisor/memory-actions";
import type {
  AdvisorMemoryActionResult,
  AdvisorMemoryItemType,
  AdvisorMemoryItemView,
  AdvisorMemoryPanelState,
  AdvisorMemoryTruthStatus,
} from "../../server/advisor/advisorMemoryTypes";
import type {
  SeniorAdvisorMessageView,
  SeniorAdvisorPanelState,
  SeniorAdvisorUsageState,
} from "../../server/advisor/seniorAdvisorTypes";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function usageTone(usage: SeniorAdvisorUsageState) {
  if (!usage.enabled || usage.exhausted) return "danger";
  if (usage.warningReached) return "warning";
  return "good";
}

function messageTone(status: SeniorAdvisorMessageView["status"]) {
  if (status === "failed") return "danger";
  if (status === "blocked") return "warning";
  return "neutral";
}

function formatStatus(status: SeniorAdvisorMessageView["status"]) {
  return status.replace(/_/g, " ");
}

function formatMemoryLabel(value: string) {
  return value.replace(/_/g, " ");
}

function memoryStatusTone(status: AdvisorMemoryItemView["status"]) {
  if (status === "active") return "good";
  if (status === "needs_review") return "warning";
  if (status === "rejected") return "danger";
  return "neutral";
}

function groupMemoryItems(memory: AdvisorMemoryPanelState, expanded: boolean) {
  const source = expanded ? memory.items : memory.previewItems;
  const active = source.filter((item) => item.status === "active");
  const needsReview = source.filter((item) => item.status === "needs_review");
  const decisions = active.filter((item) => item.type === "decision").slice(0, expanded ? 20 : 3);
  const openQuestions = active.filter((item) => item.type === "open_question").slice(0, expanded ? 20 : 3);
  const nextSteps = active.filter((item) => item.type === "next_step").slice(0, expanded ? 20 : 3);
  const shownIds = new Set([
    ...needsReview,
    ...decisions,
    ...openQuestions,
    ...nextSteps,
  ].map((item) => item.id));
  const other = source.filter((item) => !shownIds.has(item.id) && item.status !== "archived");

  return { needsReview, decisions, openQuestions, nextSteps, other };
}

function createLocalUserMessage(content: string): SeniorAdvisorMessageView {
  return {
    id: `local-user-${Date.now()}`,
    role: "user",
    content,
    status: "completed",
    provider: null,
    model: null,
    creditCost: 1,
    createdAt: new Date(),
    safetyFlags: [],
  };
}

function AdvisorMemoryItemCard({
  item,
  disabled,
  onAction,
  onSupersede,
}: {
  item: AdvisorMemoryItemView;
  disabled: boolean;
  onAction: (action: "confirm" | "reject" | "resolve" | "archive", item: AdvisorMemoryItemView) => void;
  onSupersede: (item: AdvisorMemoryItemView) => void;
}) {
  const canConfirm = item.status === "needs_review";
  const canReject = item.status === "needs_review";
  const canResolve = item.status === "active";
  const canSupersede = item.status === "active";
  const canArchive = item.status !== "archived";

  return (
    <article className="senior-advisor-memory-item">
      <div className="senior-advisor-memory-item-head">
        <div>
          <h4>{item.title}</h4>
          <p>{formatDate(item.updatedAt)}</p>
        </div>
        <div className="senior-advisor-memory-badges">
          <span className="assessment-chip assessment-chip-neutral">{formatMemoryLabel(item.type)}</span>
          <span className={`assessment-chip assessment-chip-${memoryStatusTone(item.status)}`}>
            {formatMemoryLabel(item.status)}
          </span>
        </div>
      </div>
      <p className="senior-advisor-memory-summary">{item.summary}</p>
      <div className="senior-advisor-memory-meta">
        <span>{formatMemoryLabel(item.truthStatus)}</span>
        <span>{formatMemoryLabel(item.sourceType)}</span>
        {item.confidence !== null ? <span>{item.confidence}% confidence</span> : null}
      </div>
      <div className="senior-advisor-memory-actions">
        {canConfirm ? (
          <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => onAction("confirm", item)}>
            <Check size={14} />
            Confirm
          </button>
        ) : null}
        {canReject ? (
          <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => onAction("reject", item)}>
            <X size={14} />
            Reject
          </button>
        ) : null}
        {canResolve ? (
          <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => onAction("resolve", item)}>
            <Check size={14} />
            Resolve
          </button>
        ) : null}
        {canSupersede ? (
          <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => onSupersede(item)}>
            <RotateCcw size={14} />
            Supersede
          </button>
        ) : null}
        {canArchive ? (
          <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => onAction("archive", item)}>
            <Archive size={14} />
            Archive
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function SeniorMigrationAdvisorPanel({
  initialState,
}: {
  initialState: SeniorAdvisorPanelState;
}) {
  const [messages, setMessages] = useState(initialState.messages);
  const [usage, setUsage] = useState(initialState.usage);
  const [memory, setMemory] = useState(initialState.memory);
  const [message, setMessage] = useState("");
  const [memoryExpanded, setMemoryExpanded] = useState(false);
  const [memoryDraft, setMemoryDraft] = useState<{
    type: AdvisorMemoryItemType;
    truthStatus: AdvisorMemoryTruthStatus;
    title: string;
    summary: string;
  }>({
    type: "decision",
    truthStatus: "customer_reported",
    title: "",
    summary: "",
  });
  const [feedback, setFeedback] = useState<string | null>(initialState.lockedReason);
  const [isPending, startTransition] = useTransition();
  const [isMemoryPending, startMemoryTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const maxChars = usage.enabled ? 6_000 : 0;
  const canSend = usage.enabled && !usage.exhausted && message.trim().length > 0 && !isPending;
  const disabledReason = !usage.enabled
    ? "Senior Migration Advisor is available on paid assessment plans."
    : usage.exhausted
      ? "Advisor credits are exhausted for this assessment."
      : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length, isPending]);

  function sendMessage(value: string) {
    const trimmed = value.trim();
    if (!trimmed || isPending) return;

    setFeedback(null);
    startTransition(async () => {
      const result = await sendSeniorAdvisorMessageAction(initialState.assessmentId, trimmed);
      if (result.ok) {
        setMessages((current) => [...current, createLocalUserMessage(trimmed), result.assistantMessage]);
        setUsage(result.usage);
        setMessage("");
        return;
      }

      setFeedback(result.message);
      if (result.usage) {
        setUsage(result.usage);
      }
    });
  }

  function requestCredits() {
    startTransition(async () => {
      const result = await requestSeniorAdvisorCreditsAction(initialState.assessmentId);
      setFeedback(result.message);
    });
  }

  function applyMemoryResult(result: AdvisorMemoryActionResult) {
    setFeedback(result.message);
    if (result.memory) {
      setMemory(result.memory);
    }
  }

  function runMemoryAction(action: () => Promise<AdvisorMemoryActionResult>) {
    startMemoryTransition(async () => {
      applyMemoryResult(await action());
    });
  }

  function refreshMemory() {
    runMemoryAction(() => listAdvisorMemoryItemsAction(initialState.assessmentId));
  }

  function handleMemoryAction(
    action: "confirm" | "reject" | "resolve" | "archive",
    item: AdvisorMemoryItemView,
  ) {
    const actions = {
      confirm: confirmAdvisorMemoryItemAction,
      reject: rejectAdvisorMemoryItemAction,
      resolve: resolveAdvisorMemoryItemAction,
      archive: archiveAdvisorMemoryItemAction,
    };
    runMemoryAction(() => actions[action](initialState.assessmentId, item.id));
  }

  function handleSupersedeMemory(item: AdvisorMemoryItemView) {
    const summary = window.prompt("New memory summary", item.summary);
    if (!summary?.trim()) return;

    runMemoryAction(() =>
      supersedeAdvisorMemoryItemAction({
        assessmentId: initialState.assessmentId,
        memoryItemId: item.id,
        type: item.type,
        truthStatus: item.truthStatus,
        title: item.title,
        summary,
      }),
    );
  }

  function createMemoryNote() {
    if (!memoryDraft.title.trim() || !memoryDraft.summary.trim()) {
      setFeedback("Add a title and summary before saving a memory note.");
      return;
    }

    runMemoryAction(async () => {
      const result = await createAdvisorMemoryItemAction({
        assessmentId: initialState.assessmentId,
        ...memoryDraft,
      });
      if (result.ok) {
        setMemoryDraft({
          type: "decision",
          truthStatus: "customer_reported",
          title: "",
          summary: "",
        });
      }
      return result;
    });
  }

  const memoryGroups = groupMemoryItems(memory, memoryExpanded);
  const memoryDisabled = !memory.enabled || isMemoryPending;

  return (
    <section id="senior-migration-advisor" className="assessment-section glass-card senior-advisor-shell">
      <div className="senior-advisor-header">
        <div className="assessment-section-title senior-advisor-title">
          <div className="assessment-section-eyebrow">
            <Brain size={18} />
            <span>Premium advisor</span>
          </div>
          <h2>Senior Migration Advisor</h2>
          <p>{initialState.helper.shortDescription}</p>
        </div>
        <div className="senior-advisor-status-panel">
          <span className="assessment-chip assessment-chip-neutral">{usage.planLabel}</span>
          <span className={`assessment-chip assessment-chip-${usageTone(usage)}`}>
            {usage.enabled ? `${usage.messagesRemaining} remaining` : "Plan locked"}
          </span>
          <span className="assessment-chip assessment-chip-warning">Advisory only</span>
        </div>
      </div>

      <div className="senior-advisor-usage-strip">
        <div>
          <span>Messages remaining</span>
          <strong>{usage.enabled ? usage.messagesRemaining : 0}</strong>
        </div>
        <div>
          <span>Advisor credits</span>
          <strong>
            {usage.messagesUsed} / {usage.messageLimit} used
          </strong>
        </div>
        <div>
          <span>Usage level</span>
          <strong>{usage.percentUsed}%</strong>
        </div>
        <div>
          <span>Billing</span>
          <strong>Not active</strong>
        </div>
        <div className="senior-advisor-credit-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={requestCredits}
            disabled={!usage.canRequestMoreCredits || isPending}
          >
            Request credits
          </button>
          <button type="button" className="btn btn-secondary" disabled>
            Buy credits - soon
          </button>
        </div>
      </div>

      <details className="senior-advisor-help">
        <summary>
          <span>
            <ShieldAlert size={16} />
            What can the Senior Advisor do?
          </span>
          <small>Evidence-based advisory, not migration approval.</small>
        </summary>
        <div className="senior-advisor-help-grid">
          <div>
            <div className="assessment-section-eyebrow">
              <Sparkles size={14} />
              <span>Can help with</span>
            </div>
            <ul className="assessment-bullet-list">
              {initialState.helper.canDo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="assessment-section-eyebrow">
              <Lock size={14} />
              <span>Cannot do</span>
            </div>
            <ul className="assessment-bullet-list">
              {initialState.helper.cannotDo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>

      <section className="senior-advisor-memory-panel">
        <div className="senior-advisor-memory-header">
          <div>
            <div className="assessment-section-eyebrow">
              <ClipboardList size={16} />
              <span>Project Memory</span>
            </div>
            <h3>Decisions, open questions and next steps saved for this assessment.</h3>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMemoryExpanded((current) => !current);
              if (!memoryExpanded) refreshMemory();
            }}
            disabled={!memory.available || isMemoryPending}
          >
            {memoryExpanded ? "Show less" : "Review project memory"}
          </button>
        </div>

        <div className="senior-advisor-memory-stats">
          <div>
            <span>Decisions</span>
            <strong>{memory.counts.decisions}</strong>
          </div>
          <div>
            <span>Open questions</span>
            <strong>{memory.counts.openQuestions}</strong>
          </div>
          <div>
            <span>Next steps</span>
            <strong>{memory.counts.nextSteps}</strong>
          </div>
          <div>
            <span>Needs review</span>
            <strong>{memory.counts.needsReview}</strong>
          </div>
        </div>

        {!memory.enabled ? (
          <div className="senior-advisor-memory-empty">
            <Lock size={16} />
            <p>{memory.lockedReason ?? "Project Memory is not available for this plan."}</p>
          </div>
        ) : memory.items.length === 0 ? (
          <div className="senior-advisor-memory-empty">
            <CircleHelp size={16} />
            <p>No project memory saved yet. Important decisions and open questions can be saved here as the assessment evolves.</p>
          </div>
        ) : (
          <div className="senior-advisor-memory-groups">
            {[
              ["Needs Review", memoryGroups.needsReview],
              ["Decisions", memoryGroups.decisions],
              ["Open Questions", memoryGroups.openQuestions],
              ["Next Steps", memoryGroups.nextSteps],
              ["Other Memory", memoryGroups.other],
            ].map(([label, items]) =>
              Array.isArray(items) && items.length > 0 ? (
                <div className="senior-advisor-memory-group" key={label as string}>
                  <h4>{label as string}</h4>
                  {items.map((item) => (
                    <AdvisorMemoryItemCard
                      key={item.id}
                      item={item}
                      disabled={memoryDisabled}
                      onAction={handleMemoryAction}
                      onSupersede={handleSupersedeMemory}
                    />
                  ))}
                </div>
              ) : null,
            )}
          </div>
        )}

        {memory.enabled && memoryExpanded ? (
          <details className="senior-advisor-memory-create">
            <summary>
              <Plus size={15} />
              Add memory note
            </summary>
            <div className="senior-advisor-memory-create-grid">
              <label className="form-label">
                Type
                <select
                  className="form-input"
                  value={memoryDraft.type}
                  onChange={(event) =>
                    setMemoryDraft((current) => ({
                      ...current,
                      type: event.target.value as AdvisorMemoryItemType,
                    }))
                  }
                  disabled={memoryDisabled}
                >
                  <option value="decision">Decision</option>
                  <option value="open_question">Open question</option>
                  <option value="next_step">Next step</option>
                  <option value="constraint">Constraint</option>
                  <option value="risk_interpretation">Risk interpretation</option>
                  <option value="customer_preference">Customer preference</option>
                  <option value="evidence_note">Evidence note</option>
                </select>
              </label>
              <label className="form-label">
                Truth status
                <select
                  className="form-input"
                  value={memoryDraft.truthStatus}
                  onChange={(event) =>
                    setMemoryDraft((current) => ({
                      ...current,
                      truthStatus: event.target.value as AdvisorMemoryTruthStatus,
                    }))
                  }
                  disabled={memoryDisabled}
                >
                  <option value="customer_reported">Customer reported</option>
                  <option value="user_confirmed">User confirmed</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="inferred">Inferred</option>
                  <option value="missing">Missing</option>
                  <option value="advisor_generated">Advisor generated</option>
                </select>
              </label>
              <label className="form-label">
                Title
                <input
                  className="form-input"
                  value={memoryDraft.title}
                  onChange={(event) =>
                    setMemoryDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  disabled={memoryDisabled}
                  placeholder="Decision or open question"
                />
              </label>
              <label className="form-label senior-advisor-memory-create-summary">
                Summary
                <textarea
                  className="form-input assessment-textarea"
                  rows={3}
                  value={memoryDraft.summary}
                  onChange={(event) =>
                    setMemoryDraft((current) => ({ ...current, summary: event.target.value }))
                  }
                  disabled={memoryDisabled}
                  placeholder="Save a concise, sanitized project memory note."
                />
              </label>
              <div className="senior-advisor-memory-create-actions">
                <span className="assessment-inline-note">
                  Memory notes are scoped to this assessment and never replace deterministic evidence.
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={memoryDisabled}
                  onClick={createMemoryNote}
                >
                  <Plus size={15} />
                  Save note
                </button>
              </div>
            </div>
          </details>
        ) : null}
      </section>

      <article className="senior-advisor-prompts">
        <div className="assessment-section-eyebrow">
          <MessageSquare size={16} />
          <span>Suggested prompts</span>
        </div>
        <div className="senior-advisor-prompt-grid">
          {initialState.helper.suggestedPrompts.map((prompt) => (
            <button
              type="button"
              className="senior-advisor-prompt-chip"
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={!usage.enabled || usage.exhausted || isPending}
            >
              {prompt}
            </button>
          ))}
        </div>
      </article>

      <div className="senior-advisor-console">
        <div
          className="senior-advisor-chat-scroll"
          aria-live="polite"
          aria-label="Senior Advisor conversation"
        >
          {messages.length === 0 ? (
            <div className="senior-advisor-empty-state">
              <MessageSquare size={20} />
              <div>
                <strong>Start with the current assessment evidence.</strong>
                <p>Ask what is missing, which risks matter most, or what to complete next.</p>
              </div>
            </div>
          ) : (
            messages.map((item) => (
              <article
                key={item.id}
                className={`senior-advisor-message senior-advisor-message-${item.role}`}
              >
                <div className="senior-advisor-message-head">
                  <div>
                    <h3>{item.role === "assistant" ? "Senior Migration Advisor" : "You"}</h3>
                    <p>{formatDate(item.createdAt)}</p>
                  </div>
                  <span className={`assessment-chip assessment-chip-${messageTone(item.status)}`}>
                    {formatStatus(item.status)}
                  </span>
                </div>
                <p className="senior-advisor-message-body">{item.content}</p>
                {item.role === "assistant" && (item.provider || item.model) ? (
                  <p className="senior-advisor-message-meta">
                    {[item.provider, item.model].filter(Boolean).join(" / ")}
                  </p>
                ) : null}
                {item.safetyFlags.length > 0 ? (
                  <div className="assessment-status-row">
                    {item.safetyFlags.map((flag) => (
                      <span key={flag.flag} className="assessment-chip assessment-chip-warning">
                        {flag.flag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
          {isPending ? (
            <div className="senior-advisor-pending">
              <span />
              Senior Migration Advisor is reviewing the assessment context...
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {feedback ? (
          <div className="senior-advisor-feedback">
            <span className="assessment-chip assessment-chip-warning">Advisor notice</span>
            <p>{feedback}</p>
          </div>
        ) : null}

        <form
          className="senior-advisor-composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(message);
          }}
        >
          <label className="form-label">
            Ask about this assessment
            <textarea
              className="form-input assessment-textarea senior-advisor-textarea"
              rows={4}
              value={message}
              maxLength={maxChars || undefined}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask what to complete next, how to explain a risk, why confidence is low, or what evidence would improve this assessment."
              disabled={!usage.enabled || usage.exhausted || isPending}
            />
          </label>
          <div className="senior-advisor-composer-footer">
            <span className="assessment-inline-note">
              {disabledReason
                ? disabledReason
                : usage.enabled
                ? `${message.length.toLocaleString("en-US")} characters. Do not paste passwords, tokens or raw file contents.`
                : ""}
            </span>
            <button type="submit" className="btn btn-primary btn-glow" disabled={!canSend}>
              {isPending ? "Sending..." : "Send"}
              <Send size={16} />
            </button>
          </div>
          <span className="assessment-inline-note">
            Advisor responses are advisory and cannot override deterministic ShiftReadiness engines.
          </span>
        </form>
      </div>
    </section>
  );
}
