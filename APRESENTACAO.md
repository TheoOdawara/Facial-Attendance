# GUIA RÁPIDO - APRESENTAÇÃO

## Antes da Apresentação

### 1. Iniciar o Sistema
```powershell
cd C:\desenvolvimento\FacialAttendance
.\start.ps1
```

### 2. Fazer Upload no ESP32
1. Abra `esp32/main.cpp` no Arduino IDE
2. Verifique se o MQTT_SERVER está correto (seu IP)
3. Selecione a placa: AI Thinker ESP32-CAM
4. Clique em Upload
5. Abra o Serial Monitor (115200 baud)
6. Aguarde mensagem "✓ Sistema pronto!"

---

## Durante a Apresentação

### Fluxo de Demonstração:

1. **Acesse http://localhost:3000**

2. **Cadastrar Aluno:**
   - Clique em "Cadastro de Aluno"
   - Preencha Nome (ex: "João Silva")
   - Preencha Matrícula (ex: "12345")
   - Clique em "Capturar Face (ESP32)"
   - Aguarde a imagem aparecer (preview)
   - Clique em "Cadastrar Aluno"
   - Mensagem de sucesso deve aparecer

3. **Consultar Presenças:**
   - Clique em "Consulta de Presenças"
   - Veja a lista de alunos cadastrados

---

## Troubleshooting Rápido

### ESP32 não conecta no Wi-Fi
- Verifique SSID e senha no código
- ESP32 próximo do roteador
- Reinicie o ESP32

### Timeout ao capturar imagem
- Verifique se ESP32 mostra "✓ Sistema pronto!" no Serial Monitor
- Verifique IP do MQTT_SERVER no código do ESP32
- Reinicie os containers: `docker-compose restart`

### Imagem não aparece
- Veja o Serial Monitor: deve mostrar "✓ Imagem enviada com sucesso!"
- Verifique logs do backend: `docker logs facial_backend`
- Certifique-se que Mosquitto está rodando: `docker ps`

---

## Checklist Final

- [ ] Containers rodando (`docker-compose ps`)
- [ ] ESP32 conectado no Wi-Fi (Serial Monitor)
- [ ] ESP32 conectado no MQTT (Serial Monitor)
- [ ] Frontend acessível (localhost:3000)
- [ ] Backend acessível (localhost:3001/health)

---

## Comandos Úteis

```powershell
# Ver logs do backend
docker logs facial_backend --tail 50

# Ver logs do Mosquitto
docker logs facial_mqtt --tail 50

# Reiniciar tudo
docker-compose restart

# Ver status dos containers
docker-compose ps
```
