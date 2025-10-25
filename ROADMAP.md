# ROADMAP

## Fase 1: Configuração do Ambiente
- [ ] Definir docker-compose.yml com serviços: backend, frontend, postgres, mqtt
- [ ] Criar estrutura inicial de pastas
- [ ] Configurar variáveis de ambiente (.env)

## Fase 2: Backend (API REST e Listener MQTT)
- [ ] Implementar listener MQTT com autenticação
- [ ] Implementar API RESTful (cadastro de aluno, consulta de presença)
- [ ] Integração com PostgreSQL usando node-postgres (pg)
- [ ] Processamento de imagem (reconhecimento facial)

## Fase 3: Frontend (Cadastro e Consulta)
- [ ] Criar tela de cadastro de aluno (com envio de face)
- [ ] Criar tela de consulta de presenças
- [ ] Integração com API REST

## Fase 4: Hardware (Código ESP32)
- [ ] Captura de imagem
- [ ] Envio via MQTT (com autenticação)
- [ ] Reconexão automática Wi-Fi/MQTT

## Fase 5: Integração (Testes E2E)
- [ ] Testes ponta-a-ponta (ESP32 -> Backend -> DB/Frontend)
- [ ] Documentação final e checklist de requisitos
