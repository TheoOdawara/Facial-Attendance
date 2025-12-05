-- Cria extensão, tabela de professors e insere/atualiza usuário admin padrão

-- Habilita funções de hashing (pgcrypto) para gerar bcrypt via crypt()/gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela de professores (usada pelo backend)
CREATE TABLE IF NOT EXISTS professors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'professor',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

INSERT INTO professors (name, email, password_hash, role)
VALUES (
    'Sistema',
    'sistema@facialattendance.local',
    crypt('admin1234', gen_salt('bf')),
    'admin'
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    active = TRUE,
    updated_at = CURRENT_TIMESTAMP;

-- Observação: esses scripts são executados apenas na inicialização do volume de dados do Postgres;
-- se quiser forçar re-execução, remova o volume nomeado (pgdata) antes de subir os containers.
