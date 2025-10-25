/*
 * Código ESP32-CAM para captura de imagem e envio via MQTT com autenticação
 * Integração com sistema de chamada facial
 *
 * Requisitos: Biblioteca PubSubClient, WiFi, ESP32-CAM
 */
#include <WiFi.h>
#include <PubSubClient.h>
#include "esp_camera.h"

// --- Configurações Wi-Fi e MQTT ---
#define WIFI_SSID       "Theo"
#define WIFI_PASSWORD   "laudo1234"
#define MQTT_SERVER     "172.20.10.11"  // IP do broker (SEM ESPAÇOS!)
#define MQTT_PORT       1883
#define MQTT_USER       ""  // Deixe vazio se allow_anonymous true
#define MQTT_PASSWORD   ""
#define MQTT_TOPIC_IMAGE    "facial/attendance/image"
#define MQTT_TOPIC_CAPTURE  "facial/attendance/capture"

WiFiClient espClient;
PubSubClient client(espClient);

// --- Callback para mensagens MQTT recebidas ---
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  if (strcmp(topic, MQTT_TOPIC_CAPTURE) == 0) {
    String message = "";
    for (unsigned int i = 0; i < length; i++) {
      message += (char)payload[i];
    }
    if (message == "CAPTURE") {
      Serial.println("Comando CAPTURE recebido, tirando foto...");
      captureAndSendImage();
    }
  }
}

// --- Função para conectar ao Wi-Fi ---
void connectToWifi() {
  Serial.println("\n\n=== Iniciando conexão Wi-Fi ===");
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ Wi-Fi conectado!");
    Serial.print("IP ESP32: ");
    Serial.println(WiFi.localIP());
    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("Subnet: ");
    Serial.println(WiFi.subnetMask());
    Serial.print("DNS: ");
    Serial.println(WiFi.dnsIP());
  } else {
    Serial.println("\n✗ Falha ao conectar Wi-Fi!");
    Serial.println("Verifique SSID e senha!");
  }
}

// --- Função para conectar ao MQTT ---
void connectToMqtt() {
  while (!client.connected()) {
    Serial.print("Conectando ao MQTT...");
    
    // Tenta conectar sem credenciais primeiro
    String clientId = "esp32cam-" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("MQTT conectado!");
      client.subscribe(MQTT_TOPIC_CAPTURE);
      Serial.println("Inscrito no tópico de captura");
      break;
    } else {
      Serial.print("Falha, rc=");
      Serial.print(client.state());
      Serial.println(" Tentando novamente em 5s");
      delay(5000);
    }
  }
}

// --- Função para capturar imagem e publicar via MQTT ---
void captureAndSendImage() {
  // Garante que está conectado ao MQTT antes de enviar
  if (!client.connected()) {
    Serial.println("MQTT desconectado, reconectando...");
    connectToMqtt();
  }
  
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Falha ao capturar imagem");
    return;
  }
  
  Serial.print("Imagem capturada! Tamanho: ");
  Serial.print(fb->len);
  Serial.println(" bytes");
  Serial.println("Enviando via MQTT...");
  
  // Tenta enviar com retry e QoS 0
  bool published = false;
  for (int i = 0; i < 3; i++) {
    // beginPublish para mensagens grandes
    if (client.beginPublish(MQTT_TOPIC_IMAGE, fb->len, false)) {
      size_t written = client.write(fb->buf, fb->len);
      if (written == fb->len && client.endPublish()) {
        published = true;
        Serial.println("✓ Imagem enviada com sucesso!");
        break;
      }
    }
    
    Serial.print("✗ Tentativa ");
    Serial.print(i + 1);
    Serial.println(" falhou, tentando novamente...");
    delay(1000);
    client.loop();
  }
  
  if (!published) {
    Serial.println("✗ Falha ao enviar imagem após 3 tentativas");
  }
  
  esp_camera_fb_return(fb);
}

// --- Configuração da câmera AI-Thinker ---
void initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = 5;
  config.pin_d1 = 18;
  config.pin_d2 = 19;
  config.pin_d3 = 21;
  config.pin_d4 = 36;
  config.pin_d5 = 39;
  config.pin_d6 = 34;
  config.pin_d7 = 35;
  config.pin_xclk = 0;
  config.pin_pclk = 22;
  config.pin_vsync = 25;
  config.pin_href = 23;
  config.pin_sscb_sda = 26;
  config.pin_sscb_scl = 27;
  config.pin_pwdn = 32;
  config.pin_reset = -1;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Configuração de qualidade - Alta qualidade otimizada para 32KB buffer
  if(psramFound()){
    config.frame_size = FRAMESIZE_VGA; // 640x480 - alta resolução
    config.jpeg_quality = 12; // Alta qualidade (12 = ~15-25KB para VGA)
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA; // 320x240
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }
  
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Falha ao inicializar câmera: 0x%x", err);
    return;
  }
  Serial.println("Câmera inicializada!");
}

void setup() {
  Serial.begin(115200);
  delay(2000); // Aguarda estabilizar
  Serial.println("\n\n========================================");
  Serial.println("   ESP32-CAM Facial Attendance System");
  Serial.println("========================================\n");
  
  connectToWifi();
  
  // DIAGNÓSTICO: Mostra informações detalhadas de rede
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n=== DIAGNÓSTICO DE REDE ===");
    Serial.print("IP ESP32: ");
    Serial.println(WiFi.localIP());
    Serial.print("IP do PC (broker): ");
    Serial.println(MQTT_SERVER);
    Serial.print("Máscara: ");
    Serial.println(WiFi.subnetMask());
    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());
    
    // Verifica se estão na mesma rede
    IPAddress espIP = WiFi.localIP();
    IPAddress mask = WiFi.subnetMask();
    Serial.print("Rede ESP32: ");
    Serial.print(espIP[0] & mask[0]); Serial.print(".");
    Serial.print(espIP[1] & mask[1]); Serial.print(".");
    Serial.print(espIP[2] & mask[2]); Serial.print(".");
    Serial.println(espIP[3] & mask[3]);
  }
  
  initCamera();
  
  Serial.println("\n=== Configurando MQTT ===");
  Serial.print("Servidor: ");
  Serial.println(MQTT_SERVER);
  Serial.print("Porta: ");
  Serial.println(MQTT_PORT);
  
  // Testa conectividade TCP antes de configurar MQTT
  Serial.println("\n=== Testando conectividade TCP ===");
  
  // Primeiro testa um servidor externo (Google)
  Serial.println("Testando internet (google.com:80)...");
  WiFiClient testInternet;
  if (testInternet.connect("google.com", 80, 5000)) {
    Serial.println("✓ Internet OK!");
    testInternet.stop();
  } else {
    Serial.println("✗ Sem acesso à internet!");
  }
  
  delay(500);
  
  // Testa o gateway
  Serial.print("Testando gateway (");
  Serial.print(WiFi.gatewayIP());
  Serial.println("):80...");
  WiFiClient testGateway;
  if (testGateway.connect(WiFi.gatewayIP(), 80, 3000)) {
    Serial.println("✓ Gateway acessível!");
    testGateway.stop();
  } else {
    Serial.println("✗ Gateway inacessível! (AP Isolation do iPhone)");
  }
  
  delay(500);
  
  // Agora testa o broker
  Serial.print("Tentando conectar no broker ");
  Serial.print(MQTT_SERVER);
  Serial.print(":");
  Serial.println(MQTT_PORT);
  
  WiFiClient testClient;
  testClient.setTimeout(5000); // 5 segundos timeout
  if (testClient.connect(MQTT_SERVER, MQTT_PORT)) {
    Serial.println("✓ Conectividade TCP OK!");
    Serial.println("Porta 1883 está acessível!");
    testClient.stop();
  } else {
    Serial.println("✗ FALHA na conectividade TCP!");
    Serial.println("\n*** PROBLEMA: Hotspot do iPhone bloqueia comunicação entre dispositivos! ***");
    Serial.println("\nSOLUÇÕES:");
    Serial.println("  1. Use cabo USB do iPhone → PC (compartilhamento via USB)");
    Serial.println("  2. Use um roteador Wi-Fi comum");
    Serial.println("  3. Crie hotspot no Windows (ver criar-hotspot.ps1)");
  }
  
  delay(1000);
  
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);
  client.setBufferSize(32768); // 32KB - suporta VGA de alta qualidade
  client.setKeepAlive(60); // 60 segundos keepalive para evitar timeout
  
  Serial.println("Configuração MQTT concluída");
  
  connectToMqtt();
  
  Serial.println("\n✓ Sistema pronto!");
  Serial.println("Aguardando comandos MQTT...\n");
}

void loop() {
  if (!client.connected()) {
    connectToMqtt();
  }
  client.loop();
}
