import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, apiRequest } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { BillingStatus, ChatMessage } from "../types";

const quickPrompts = [
  "Trocar o primeiro exercicio de hoje",
  "Criar uma versao rapida do treino",
  "Como progredir carga com seguranca?",
  "Monte um treino para viagem",
];

export function ChatPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const billingQuery = useQuery({
    queryKey: ["billing-status", token],
    queryFn: () => apiRequest<BillingStatus>("/billing/status", { token }),
  });

  const chatQuery = useQuery({
    queryKey: ["chat-messages", token],
    queryFn: () => apiRequest<ChatMessage[]>("/chat/messages", { token }),
    refetchInterval: 2500,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      setChatError(null);

      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "USER",
        content,
        createdAt: new Date().toISOString(),
      };

      setOptimisticMessages((current) => [...current, tempMessage]);

      return apiRequest("/chat", {
        method: "POST",
        token,
        body: JSON.stringify({ message: content }),
      });
    },
    onSuccess: () => {
      setMessage("");
      setOptimisticMessages([]);
      queryClient.invalidateQueries({ queryKey: ["chat-messages", token] });
      queryClient.invalidateQueries({ queryKey: ["billing-status", token] });
    },
    onError: (error) => {
      setOptimisticMessages([]);

      if (error instanceof ApiError) {
        setChatError(error.message);
        return;
      }

      setChatError("Nao foi possivel enviar sua mensagem agora.");
    },
  });

  const submitMessage = (content: string) => {
    const trimmed = content.trim();
    const aiBlocked =
      billingQuery.data?.effectivePlan === "FREE" &&
      (billingQuery.data.monthlyMessagesRemaining ?? 0) <= 0;

    if (!trimmed || sendMutation.isPending || aiBlocked) {
      return;
    }

    sendMutation.mutate(trimmed);
  };

  const messages = useMemo(
    () => [...(chatQuery.data ?? []), ...optimisticMessages],
    [chatQuery.data, optimisticMessages],
  );
  const billing = billingQuery.data;
  const aiBlocked =
    billing?.effectivePlan === "FREE" && (billing.monthlyMessagesRemaining ?? 0) <= 0;

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitMessage(message);
  };

  return (
    <section className="page stack-lg">
      <div className="hero-card hero-card--chat">
        <p className="eyebrow">Assistente de treino</p>
        <h2>Adapte o plano sem sair da rotina</h2>
        <p>
          A IA pode sugerir trocas e atalhos, mas nao faz diagnostico medico nem garante
          resultados.
        </p>
        <div className="hero-inline-stats">
          <span>{billing?.effectivePlan === "PREMIUM" ? "Premium" : "Free"}</span>
          <span>
            {billing
              ? `${billing.monthlyMessagesRemaining}/${billing.monthlyMessageLimit} mensagens`
              : "Atualizacao ao vivo"}
          </span>
          <span>Suporte educacional</span>
        </div>
      </div>

      {aiBlocked ? (
        <article className="card stack card--warning">
          <p className="eyebrow">Limite mensal atingido</p>
          <h3>O Coach IA pausou novas respostas no plano Free</h3>
          <p>Ative o Premium para teste ou aguarde o proximo ciclo mensal para continuar.</p>
          <Link className="primary-button primary-button--small" to="/app/plans">
            Ver planos
          </Link>
        </article>
      ) : null}

      <div className="choice-row choice-row--scroll">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            className="chip"
            disabled={sendMutation.isPending || aiBlocked}
            onClick={() => submitMessage(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <article className="card chat-card">
        <div className="chat-list" ref={listRef}>
          {messages.length ? (
            messages.map((entry) => (
              <div
                key={entry.id}
                className={
                  entry.role === "ASSISTANT"
                    ? "chat-bubble chat-bubble--assistant"
                    : "chat-bubble"
                }
              >
                <strong>{entry.role === "ASSISTANT" ? "Personal IA" : "Voce"}</strong>
                <p>{entry.content}</p>
              </div>
            ))
          ) : (
            <p className="muted">Comece pedindo uma troca de exercicio ou uma versao rapida.</p>
          )}
          {sendMutation.isPending ? <div className="chat-status">Personal IA esta pensando...</div> : null}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            disabled={sendMutation.isPending || aiBlocked}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ex.: Troque o supino por uma opcao para ombro sensivel"
            rows={3}
            value={message}
          />
          {chatError ? <p className="form-error">{chatError}</p> : null}
          <button
            className="primary-button primary-button--small"
            disabled={sendMutation.isPending || aiBlocked}
            type="submit"
          >
            {sendMutation.isPending ? "Enviando..." : aiBlocked ? "Limite atingido" : "Enviar"}
          </button>
        </form>
      </article>
    </section>
  );
}
