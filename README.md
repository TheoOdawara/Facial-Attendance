# FacialAttendance

Versão: 1.0.0
Última modificação: 2025-11-28

Visão geral
----------
FacialAttendance é uma solução internal para automação de controle de presença por reconhecimento facial. Este documento é uma README profissional, destinada a uso interno de times de engenharia — contém visão técnica, instruções de deploy, arquitetura, segurança e procedimentos operacionais.

Objetivo do repositório
-----------------------
- Fornecer um sistema end-to-end para captura, processamento e registro de presença baseado em reconhecimento facial.
- Permitir integração com dispositivos embarcados (ESP32) e serviços de visão (OpenCV) em containers.
- Oferecer pipelines reprodutíveis via Docker Compose para desenvolvimento e testes em ambiente controlado.

Conteúdo deste repositório
--------------------------
- `backend/` — API Node.js (Express), rotas, serviços e integração com face-api e MQTT.
- `frontend/` — SPA React (MUI) para administração e visualização de presenças.
- `OpenCv/` — serviço Python com OpenCV para extração e comparação de encodings faciais.
- `esp32/` — código-fonte de firmware exemplo (C++) para captura e upload de imagens.
- `docker-compose.yml` — orquestração local (Postgres, Mosquitto, backend, frontend, faceapi).

Arquitetura (resumo técnico)
---------------------------
1. Frontend (React) chama Backend (REST) para operações CRUD e inicia fluxos de captura.
2. Backend publica comando `CAPTURE` no tópico MQTT (Mosquitto).
3. Dispositivos subscritos (ESP32) recebem o comando, capturam imagem e realizam upload HTTP multipart para o Backend.
4. Backend emite evento interno (`image_received`) e encaminha a imagem para o serviço OpenCv para processamento.
5. OpenCv retorna um encoding / resultado de matching; Backend persiste presença em PostgreSQL.

Diagrama simplificado:

Frontend ↔ Backend ↔ PostgreSQL
					 ↑
					 | HTTP (upload)
ESP32 ← MQTT — Mosquitto
					 ↓
				 OpenCv

Requisitos e pré-requisitos
---------------------------
- Docker >= 20.x, Docker Compose V2
- Recursos mínimos para desenvolvimento: 4 CPU, 6 GB RAM
- Porta padrão do backend: 3001
- Porta padrão do frontend (serving): 3000

Variáveis de ambiente relevantes (exemplo)
----------------------------------------
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`
- `JWT_SECRET`
- `FACEAPI_URL` (URL ou nome do serviço Docker do OpenCv)
- Configurações do MQTT (`MQTT_HOST`, `MQTT_PORT`) — usadas pelo backend

Deploy local (desenvolvimento)
------------------------------
1. Copie/ajuste arquivos `.env` em `backend/` e `frontend/` conforme necessário.
2. Build e start:

```powershell
docker compose build
docker compose up -d
```

3. Verifique logs:

```powershell
docker compose logs -f backend
docker compose logs -f facial_faceapi
```

Observações de produção
-----------------------
- Em ambiente de produção: usar orquestrador (Kubernetes), secrets manager (HashiCorp Vault / AWS Secrets Manager), e ingress/HTTPS terminator.
- O broker MQTT deve estar gerenciado (cluster ou serviço gerenciado) e segmentado para QoS apropriado.
- Dimensionamento do serviço OpenCv: avaliar uso de GPU/CPU e preparar healthchecks e readiness probes.

Banco de dados e migrações
-------------------------
- Esquema principal: `students`, `attendance`, `professors`, `classes`.
- Migrações estão em `backend/migrations/`.
- Reset (apenas em dev):

```powershell
docker exec facial_postgres psql -U facialuser -d facialdb -c "TRUNCATE TABLE attendance, students RESTART IDENTITY CASCADE;"
```

API (resumo)
------------
- Autenticação: `POST /api/auth/login` (JWT)
- Students: `GET /api/students`, `POST /api/students`, `GET /api/students/:id`, `PUT /api/students/:id`, `DELETE /api/students/:id`
- Capture: `POST /api/capture` (dispara MQTT e aguarda), `POST /api/esp32/upload-image` (ESP32 -> upload)
- Attendance: endpoints de listagem e relatórios (em `backend/routes/attendanceRoutes.js`)

Logs e monitoramento
--------------------
- Logs em contêineres: `docker compose logs --tail 200 backend`.
- Recomenda-se integrar com ELK/EFK ou Datadog/Prometheus + Grafana para métricas e alertas.

Segurança
--------
- Trocar `JWT_SECRET` e credenciais do Postgres em produção; não armazenar segredos no repositório.
- Usar TLS entre serviços quando remoto (HTTPS para backend/frontend, TLS para MQTT se suportado).
- Controle de acesso: RBAC no frontend e validações no backend (middleware auth já presente em `backend/middlewares/`).

Desenvolvimento e contribution
------------------------------
- Branching: usar feature branches e PRs. A branch `main` contém o estado pronto para deploy.
- Tests: adicionar testes unitários e E2E (ex.: Jest + supertest para backend; Cypress para frontend).
- Código: seguir linting/format (prettier/eslint) antes do commit.

Operações e troubleshooting
--------------------------
- Problema comum: `OpenCV !_src.empty()` -> payload de imagem inválido ou base64 corrompido. Verificar logs do `faceapi` e tamanho do payload.
- Se a rota de captura retornar timeout: verificar se o dispositivo ESP32 está online e se o broker MQTT recebeu `CAPTURE`.
- Para reiniciar serviços: `docker compose up -d --no-deps --force-recreate backend frontend`.

Checklist de entrega (para PM/Engenharia)
---------------------------------------
- ✅ Código backend e frontend com rotas e páginas principais
- ✅ Serviço de reconhecimento funcional em container (OpenCv)
- ✅ Fluxo de captura via MQTT e upload via ESP32 (exemplo)
- ✅ Scripts/migrations para criação de esquema básico

Contatos e suporte
------------------
- Dono do repositório / time: Theo Odawara
- Canal de suporte: Slack (canal #facial-attendance) / Email: team@example.com

Licença e uso
-------------
Projeto para uso interno e acadêmico; para uso em produção revisar termos de licença e conformidade com políticas de privacidade e proteção de dados.

----

Se desejar, eu posso:
- aplicar um commit com a mensagem `chore(docs): add professional README_FINAL.md` e dar push para o remoto; ou
- gerar uma versão PDF desse README para anexar à documentação de entrega.

