-- Schema inicial do banco de dados para FacialAttendance

-- Extensão para hashing (usada em seeds para gerar bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Professores / usuários do sistema
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

-- Turmas
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
    academic_period VARCHAR(50),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE (name)
);

-- Alunos
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    registration_number VARCHAR(30) UNIQUE NOT NULL,
    face_encoding TEXT NOT NULL,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Presenças
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_path TEXT, -- opcional: caminho da imagem salva
    recognized BOOLEAN DEFAULT TRUE
);
