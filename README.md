# FacialAttendance: Sistema de Chamada por Reconhecimento Facial

## Descrição
Protótipo de sistema de chamada escolar utilizando reconhecimento facial. O fluxo principal envolve:
- **ESP32-CAM** captura imagem do aluno.
- Imagem enviada via **MQTT** para o backend.
- **Backend Node.js** processa a imagem, realiza o reconhecimento facial e armazena o registro de presença no **PostgreSQL**.
- **Frontend React** permite cadastro de alunos (com suas faces) e consulta de presenças.

## Arquitetura
```
[ESP32-CAM] --(MQTT)--> [Backend Node.js] --(REST/API)--> [Frontend React]
                        |--(PostgreSQL)
```
- **Hardware:** ESP32-CAM (C++/Arduino)
- **Comunicação:** MQTT (Mosquitto)
- **Backend:** Node.js (Express, node-postgres)
- **Frontend:** React
- **Banco:** PostgreSQL
- **DevOps:** Docker, Docker Compose

## Stack Tecnológica
- ESP32-CAM (C++/Arduino)
- Node.js (Express, node-postgres)
- React
- PostgreSQL
- Mosquitto (MQTT Broker)
- Docker & Docker Compose

## Padrões e Convenções
- **Backend:** camelCase para funções/variáveis, PascalCase para classes, RESTful APIs, JSDoc obrigatório.
- **Frontend:** PascalCase para componentes, camelCase para hooks/funções/variáveis, uso de Hooks.
- **Hardware:** snake_case para defines/globais, camelCase para funções, comentários explicativos.
- **Banco:** Interação direta via `pg` (sem ORM).
- **MQTT:** Autenticação obrigatória.

## Conteinerização
Cada serviço (backend, frontend, banco, broker MQTT, faceapi) roda em container Docker separado, orquestrados via docker-compose.

---

## Como rodar o projeto

### 1. Pré-requisitos
- Docker e Docker Compose instalados
- Arduino IDE (para ESP32)
- ESP32-CAM com biblioteca PubSubClient instalada

### 2. Inicio Rápido
```powershell
# Execute o script de inicialização
.\start.ps1
```

**OU manualmente:**

```powershell
# Subindo os containers
docker-compose down
docker-compose up -d --build

# Aguarde ~10 segundos e verifique
docker-compose ps
```

### 3. Configurando o ESP32-CAM
1. Abra `esp32/main.cpp` no Arduino IDE
2. **IMPORTANTE:** Ajuste o `MQTT_SERVER` para o IP da sua máquina:
   - Execute `ipconfig` no PowerShell
   - Copie o IPv4 Address (ex: 192.168.1.100)
   - Cole em `#define MQTT_SERVER "SEU_IP_AQUI"`
3. Compile e faça upload para o ESP32-CAM
4. Abra Serial Monitor (115200 baud)

### 4. Inicializando o banco de dados
```powershell
Get-Content backend\schema.sql | docker exec -i facial_postgres psql -U facialuser -d facialdb
```

### 5. Acessando o sistema
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **MQTT Broker:** mqtt://localhost:1883

### 5. Fluxo do MVP
1. **Cadastro de Aluno:**
   - Acesse http://localhost:3000
   - Preencha nome e matrícula
   - Clique em "Capturar Face (ESP32)"
   - ESP32 tira a foto e envia via MQTT
   - Imagem aparece como preview no frontend
   - Clique em "Cadastrar Aluno" para salvar

2. **Consulta de Presenças:**
   - Clique em "Consulta de Presenças"
   - Veja lista de alunos cadastrados com data/hora

---

## 📋 Guia de Apresentação
Consulte [APRESENTACAO.md](./APRESENTACAO.md) para checklist e troubleshooting.

---

## Checklist Final do MVP
- [x] Docker Compose com backend, frontend, banco, MQTT, faceapi
- [x] Backend Node.js (API REST, integração faceapi, PostgreSQL)
- [x] Frontend React (cadastro, consulta)
- [x] Banco de dados com schema inicial
- [x] Serviço Python (Flask/OpenCV) para reconhecimento facial
- [x] Código ESP32-CAM para captura e envio de imagem via MQTT
- [x] Documentação e instruções de uso

---

## Documentação
- [ROADMAP.md](./ROADMAP.md): Fases do projeto
- [NEXT_STEPS.md](./NEXT_STEPS.md): Próximas tarefas
