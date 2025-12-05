# FacialAttendance

INTEGRANTES DO GRUPO:
- Theo Christiano da Silva Odawara	
- Vinicius Larsen Santos
- Pedro Gabry Barbosa

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
API (resumo)
------------
- Autenticação: `POST /api/auth/login` (JWT)
- Students: `GET /api/students`, `POST /api/students`, `GET /api/students/:id`, `PUT /api/students/:id`, `DELETE /api/students/:id`
- Capture: `POST /api/capture` (dispara MQTT e aguarda), `POST /api/esp32/upload-image` (ESP32 -> upload)
- Attendance: endpoints de listagem e relatórios (em `backend/routes/attendanceRoutes.js`)

Checklist de entrega 
---------------------------------------
- ✅ Código backend e frontend com rotas e páginas principais
- ✅ Serviço de reconhecimento funcional em container (OpenCv)
- ✅ Fluxo de captura via MQTT e upload via ESP32 (exemplo)
- ✅ Scripts/migrations para criação de esquema básico

Licença e uso
-------------
Projeto para uso acadêmico;