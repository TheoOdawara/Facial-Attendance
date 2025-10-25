# CHANGELOG - FacialAttendance# CHANGELOG



## [1.0.0-rebuilt] - 2025-10-25## MVP 1.0 (24/10/2025)

- Estrutura inicial do projeto criada

### 🔧 CORREÇÕES CRÍTICAS- docker-compose.yml com backend, frontend, postgres, mqtt, faceapi

- Schema do banco de dados (students, attendance)

#### Backend- Backend Node.js: API REST, integração com faceapi, registro e consulta de presenças

- **CRITICAL FIX:** Alterado `PYTHON_FACE_API_URL` de `http://localhost:5000/recognize` para `http://faceapi:5000/recognize` em `backend/.env`- Frontend React: cadastro de aluno, consulta de presenças

  - **Motivo:** Containers Docker devem usar service names, não localhost- Serviço Python (Flask/OpenCV) para reconhecimento facial

  - **Impacto:** Backend consegue comunicar com Python API- Código ESP32-CAM para captura e envio de imagem via MQTT

- Documentação e checklist final

- **BUG FIX:** Corrigido tracking de temp IDs em `backend/routes/studentRoutes.js`
  - **Problema:** Temp ID sendo gerado duas vezes com valores diferentes
  - **Solução:** Criada variável `const tempId = 'temp_' + Date.now()` reutilizada em ambas as chamadas
  - **Impacto:** Encodings temporários são removidos corretamente

- **NEW:** Adicionada rota `GET /api/students` para listagem de alunos
  - Retorna array de objetos com id, name, registration_number, created_at
  - Ordenação por created_at DESC
  - JSDoc completo

- **IMPROVEMENT:** Adicionado logging de `req.body` em POST /api/students
  - Facilita debugging de requisições inválidas

#### Python Face API
- **REFACTOR:** Reorganizado `faceapi/app.py`
  - Removida duplicação de `ENCODINGS_FILE`
  - Reordenadas funções: load_known_faces → remove_all_temp_encodings → save_known_faces → routes
  - Garantida inicialização correta de variáveis globais

- **BUG FIX:** Corrigida remoção de encodings temporários
  - Função `remove_all_temp_encodings()` chamada ao iniciar
  - Endpoint `/remove-temp` implementado corretamente
  - Remoção de temp também no endpoint `/register` quando nome coincide

#### Docker
- **WARNING FIX:** Removido atributo `version` de `docker-compose.yml` (obsoleto)
- **WARNING FIX:** Corrigido casing `FROM node:18-alpine as build` → `FROM node:18-alpine AS build` em `frontend/Dockerfile`

### 🏗️ INFRAESTRUTURA

#### Rebuild Completo
- Executado `docker system prune -a -f` para limpar cache corrompido
- Rebuild com `docker-compose build --no-cache` para garantir imagens limpas
- Recriados todos os volumes e rede

#### Banco de Dados
- Criadas tabelas `students` e `attendance` com schema correto
- Confirmado 0 registros em ambas as tabelas
- PostgreSQL 15 rodando e pronto para conexões

#### Face Encodings
- Arquivo `face_encodings.json` inicializado vazio `{}`
- Pronto para receber encodings de alunos cadastrados

### 📊 STATUS ATUAL

#### Containers Rodando
- ✅ facial_frontend (port 3000)
- ✅ facial_backend (port 3001)
- ✅ facial_faceapi (port 5000)
- ✅ facial_postgres (port 5432)
- ✅ facial_mqtt (port 1883)

#### APIs Testadas
- ✅ GET /api/students → retorna []
- ✅ GET /health → retorna { status: 'ok' }
- ✅ Frontend acessível em http://localhost:3000

### 📝 ARQUIVOS MODIFICADOS

```
backend/.env                      ← PYTHON_FACE_API_URL corrigido
backend/routes/studentRoutes.js   ← Temp ID tracking + GET route
faceapi/app.py                    ← Reorganização completa
docker-compose.yml                ← Removido version
frontend/Dockerfile               ← Casing corrigido
ROADMAP.md                        ← Atualizado progresso
NEXT_STEPS.md                     ← Documentado status
STATUS.md                         ← Criado
CHANGELOG.md                      ← Este arquivo
```

### 🧪 PRÓXIMOS TESTES

1. Cadastro de aluno via frontend
2. Validação de encodings em face_encodings.json
3. Teste de reconhecimento via /recognize
4. Integração MQTT com ESP32

### 🐛 BUGS CONHECIDOS

Nenhum bug conhecido no momento. Sistema pronto para testes.

### ⚠️ BREAKING CHANGES

- **Backend:** Variável de ambiente `PYTHON_FACE_API_URL` agora aponta para service name Docker
- **Docker:** Removido atributo `version` (compatibilidade com Compose v2+)

### 📚 DOCUMENTAÇÃO

- Criado `STATUS.md` com overview completo do sistema
- Atualizado `ROADMAP.md` com progresso das fases
- Atualizado `NEXT_STEPS.md` com ações imediatas

---

**Versão pronta para testes de cadastro de aluno.**
