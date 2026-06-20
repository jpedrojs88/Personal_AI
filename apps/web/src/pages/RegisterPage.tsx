import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await register({ displayName, email, password });
      setRedirectTo("/onboarding");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Falha ao criar conta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Cadastro</p>
        <h1>Crie seu ambiente de treino inteligente</h1>
        <p className="auth-copy">
          O Personal IA age como assistente educacional e nunca substitui avaliacao medica.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nome</span>
            <input
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Como voce quer ser chamado"
              value={displayName}
            />
          </label>

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
            {isSubmitting ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="auth-footer">
          Ja possui acesso? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </section>
  );
}
