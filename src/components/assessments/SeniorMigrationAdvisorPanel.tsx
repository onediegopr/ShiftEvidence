"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Brain,
  Lock,
  MessageSquare,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  requestSeniorAdvisorCreditsAction,
  sendSeniorAdvisorMessageAction,
} from "../../app/dashboard/assessments/[id]/advisor/actions";
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

export function SeniorMigrationAdvisorPanel({
  initialState,
}: {
  initialState: SeniorAdvisorPanelState;
}) {
  const [messages, setMessages] = useState(initialState.messages);
  const [usage, setUsage] = useState(initialState.usage);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(initialState.lockedReason);
  const [isPending, startTransition] = useTransition();
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
