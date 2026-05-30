"use client";

import { useState, useTransition } from "react";
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
  const maxChars = usage.enabled ? 6_000 : 0;
  const canSend = usage.enabled && !usage.exhausted && message.trim().length > 0 && !isPending;

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
    <section id="senior-migration-advisor" className="assessment-section glass-card">
      <div className="assessment-section-title">
        <div className="assessment-section-eyebrow">
          <Brain size={18} />
          <span>Premium advisor</span>
        </div>
        <h2>Senior Migration Advisor</h2>
        <p>{initialState.helper.shortDescription}</p>
      </div>

      <div className="assessment-status-row">
        <span className={`assessment-chip assessment-chip-${usageTone(usage)}`}>
          {usage.enabled ? `${usage.messagesRemaining} messages remaining` : "Plan locked"}
        </span>
        <span className="assessment-chip assessment-chip-neutral">
          {usage.messagesUsed} / {usage.messageLimit} used
        </span>
        <span className="assessment-chip assessment-chip-warning">
          Advisory only, not migration approval
        </span>
        <span className="assessment-chip assessment-chip-neutral">{usage.planLabel}</span>
      </div>

      <div className="assessment-optional-module-panel">
        <ShieldAlert size={24} />
        <div>
          <h3>Evidence-based advisory, not a generic chatbot.</h3>
          <p>
            The advisor uses this assessment context only. It can explain findings, risks,
            missing evidence, Storage/Ceph and Licensing results, but it cannot guarantee success,
            approve production migration or execute infrastructure changes.
          </p>
        </div>
        <div className="assessment-optional-module-meta">
          <span>Usage warning at 80%</span>
          <span>More credits: contact us placeholder</span>
          <span>Billing integration: not active</span>
        </div>
      </div>

      <div className="assessment-preview-columns">
        <article className="glass-card assessment-subcard">
          <div className="assessment-section-eyebrow">
            <Sparkles size={16} />
            <span>Can help with</span>
          </div>
          <ul className="assessment-bullet-list">
            {initialState.helper.canDo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="glass-card assessment-subcard">
          <div className="assessment-section-eyebrow">
            <Lock size={16} />
            <span>Cannot do</span>
          </div>
          <ul className="assessment-bullet-list">
            {initialState.helper.cannotDo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <article className="glass-card assessment-subcard">
        <div className="assessment-inventory-table-head">
          <div>
            <h3>Advisor credits</h3>
            <p className="assessment-inline-note">
              Your plan includes a limited number of advisor messages for this assessment.
              Additional advisor credits will be available as a future add-on.
            </p>
          </div>
          <span className={`assessment-chip assessment-chip-${usageTone(usage)}`}>
            {usage.percentUsed}% used
          </span>
        </div>
        <div className="assessment-inline-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={requestCredits}
            disabled={!usage.canRequestMoreCredits || isPending}
          >
            Request more advisor credits
          </button>
          <button type="button" className="btn btn-secondary" disabled>
            Buy more credits - coming soon
          </button>
        </div>
      </article>

      <article className="glass-card assessment-subcard">
        <div className="assessment-section-eyebrow">
          <MessageSquare size={16} />
          <span>Suggested prompts</span>
        </div>
        <div className="assessment-inline-actions">
          {initialState.helper.suggestedPrompts.map((prompt) => (
            <button
              type="button"
              className="btn btn-secondary"
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={!usage.enabled || usage.exhausted || isPending}
            >
              {prompt}
            </button>
          ))}
        </div>
      </article>

      <div className="assessment-accordion-list">
        {messages.length === 0 ? (
          <p className="assessment-empty-note">
            No advisor messages yet. Ask a question about this assessment to start.
          </p>
        ) : (
          messages.map((item) => (
            <article key={item.id} className="glass-card assessment-subcard">
              <div className="assessment-inventory-table-head">
                <div>
                  <h3>{item.role === "assistant" ? "Senior Migration Advisor" : "You"}</h3>
                  <p className="assessment-inline-note">
                    {formatDate(item.createdAt)}
                    {item.model ? ` - ${item.model}` : ""}
                  </p>
                </div>
                <span className={`assessment-chip assessment-chip-${messageTone(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p style={{ whiteSpace: "pre-wrap" }}>{item.content}</p>
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
      </div>

      {feedback ? (
        <article className="glass-card assessment-subcard">
          <span className="assessment-chip assessment-chip-warning">Advisor notice</span>
          <p>{feedback}</p>
        </article>
      ) : null}

      <form
        className="assessment-form-grid assessment-form-grid-wide"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(message);
        }}
      >
        <label className="form-label assessment-form-span-2">
          Ask about this assessment
          <textarea
            className="form-input assessment-textarea"
            rows={5}
            value={message}
            maxLength={maxChars || undefined}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask what to complete next, how to explain a risk, why confidence is low, or what evidence would improve this assessment."
            disabled={!usage.enabled || usage.exhausted || isPending}
          />
          <span className="assessment-inline-note">
            {usage.enabled
              ? `${message.length.toLocaleString("en-US")} characters. Do not paste passwords, tokens or raw file contents.`
              : "Senior Migration Advisor is available on paid assessment plans."}
          </span>
        </label>
        <div className="assessment-inline-actions assessment-form-span-2">
          <button type="submit" className="btn btn-primary btn-glow" disabled={!canSend}>
            {isPending ? "Sending..." : "Send to Senior Advisor"}
            <Send size={16} />
          </button>
          <span className="assessment-inline-note">
            Advisor responses are advisory and cannot override deterministic ShiftReadiness engines.
          </span>
        </div>
      </form>
    </section>
  );
}
