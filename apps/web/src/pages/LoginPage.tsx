import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("demo@personalia.app");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  if (redirectTo) {
    return <Navigate replace to={redirectTo} />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      setRedirectTo("/app");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Falha ao entrar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Personal IA</p>
        <h1>Seu personal trainer com IA no bolso</h1>
        <p className="auth-copy">
          Monte treinos personalizados, registre cargas e adapte sua rotina sem perder
          consistencia.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-footer">
          Ainda nao tem conta? <Link to="/register">Criar cadastro</Link>
        </p>
      </div>
    </section>
  );
}
