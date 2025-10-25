# ROADMAP

## Fase 1: Configuração do Ambiente ✅ COMPLETA
- [x] Definir docker-compose.yml com serviços: backend, frontend, postgres, mqtt, faceapi
- [x] Criar estrutura inicial de pastas
- [x] Configurar variáveis de ambiente (.env)
- [x] Configurar rede Docker (facialnet)
- [x] Configurar volumes (pgdata, mqtt_data, mqtt_log)

## Fase 2: Backend (API REST e Listener MQTT) ✅ COMPLETA
- [x] Implementar listener MQTT com autenticação
- [x] Implementar API RESTful (cadastro de aluno, consulta de presença)
- [x] Integração com PostgreSQL usando node-postgres (pg)
- [x] Integração com Python API para reconhecimento facial
- [x] Rota GET /api/students para listagem
- [x] Rota POST /api/students para cadastro
- [x] Gerenciamento de encodings temporários
- [x] Logging completo de requisições

## Fase 3: Python Face API 🔧 EM DESENVOLVIMENTO
- [x] Criar serviço Flask para reconhecimento facial
- [x] Implementar endpoint /register para cadastro de faces
- [x] Implementar endpoint /recognize para reconhecimento
- [x] Implementar endpoint /remove-temp para limpeza
- [x] Gerenciamento de face_encodings.json
- [ ] Testes unitários de reconhecimento
- [ ] Validação de qualidade de imagem

## Fase 4: Frontend (Cadastro e Consulta) ✅ COMPLETA
- [x] Criar tela de cadastro de aluno (com envio de face)
- [x] Criar tela de consulta de presenças
- [x] Integração com API REST
- [x] Build otimizado com Nginx

## Fase 5: Hardware (Código ESP32) ⏳ PENDENTE
- [ ] Captura de imagem
- [ ] Envio via MQTT (com autenticação)
- [ ] Reconexão automática Wi-Fi/MQTT

## Fase 6: Integração (Testes E2E) ⏳ PENDENTE
- [ ] Testes ponta-a-ponta (ESP32 -> Backend -> DB/Frontend)
- [ ] Testes de cadastro via frontend
- [ ] Testes de reconhecimento via MQTT
- [ ] Documentação final e checklist de requisitos

