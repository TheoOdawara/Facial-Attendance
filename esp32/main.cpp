
#include <WiFi.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include "esp_camera.h"

// --- Configurações Wi-Fi e MQTT ---
#define WIFI_SSID       "Theo"
#define WIFI_PASSWORD   "laudo1234"
#define MQTT_SERVER     "172.20.10.2"  // IP do broker 
#define MQTT_PORT       1883
#define MQTT_USER       ""  
#define MQTT_PASSWORD   ""
#define MQTT_TOPIC_IMAGE    "facial/attendance/image"
#define MQTT_TOPIC_CAPTURE  "facial/attendance/capture"
bool shouldCapture = false; // Flag de controle

// Backend HTTP 
#define BACKEND_HOST    "172.20.10.2"
#define BACKEND_PORT    3001

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
    Serial.println("Comando recebido. Agendando captura...");
    shouldCapture = true; // Apenas levanta a flag
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

// --- Função para capturar imagem e enviar via HTTP ---
void captureAndSendImage() {
  camera_fb_t *fb = nullptr;
  
  //limpa o buffer antigo
  fb = esp_camera_fb_get();
  if (fb) {
    esp_camera_fb_return(fb); // Devolve o buffer 
    delay(400); // Pequena pausa para o sensor atualizar
  }

  // 2. Captura a imagem REAL
  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("✗ Falha ao capturar imagem");
    return;
  }

  Serial.printf("✓ Imagem capturada! Tamanho: %d bytes\n", fb->len);

  // --- INICIO DO ENVIO HTTP ---
  HTTPClient http;
  
  String url = "http://" + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + "/api/esp32/upload-image";
  Serial.println("Enviando para: " + url);
  
  http.begin(url);
  http.setTimeout(20000); 
  
  String boundary = "----ESP32CAMBoundary";
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  
  String bodyStart = "--" + boundary + "\r\n";
  bodyStart += "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n";
  bodyStart += "Content-Type: image/jpeg\r\n\r\n";
  String bodyEnd = "\r\n--" + boundary + "--\r\n";
  
  size_t totalLen = bodyStart.length() + fb->len + bodyEnd.length();
  uint8_t *body = (uint8_t*)malloc(totalLen);
  
  if (!body) {
    Serial.println("✗ Falha de memória no ESP32");
    esp_camera_fb_return(fb);
    http.end();
    return;
  }
  
  // Monta o pacote na memória
  memcpy(body, bodyStart.c_str(), bodyStart.length());
  memcpy(body + bodyStart.length(), fb->buf, fb->len);
  memcpy(body + bodyStart.length() + fb->len, bodyEnd.c_str(), bodyEnd.length());
  
  int httpCode = http.POST(body, totalLen);
  
  free(body);
  esp_camera_fb_return(fb); // Libera a câmera IMEDIATAMENTE após copiar os dados
  
  if (httpCode == HTTP_CODE_OK) {
    Serial.println("✓ UPLOAD SUCESSO!");
  } else {
    Serial.printf("✗ Erro HTTP: %d\n", httpCode);
    // Se der erro, tenta reconectar wifi na proxima
    if (httpCode < 0) WiFi.disconnect(); 
  }
  
  http.end();
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
  
  // Configuração otimizada: SVGA com compressão média (~10-15KB)
  if(psramFound()){
    config.frame_size = FRAMESIZE_SVGA; // 800x600 
    config.jpeg_quality = 15; // Compressão média (15 = ~10-15KB para SVGA)
    config.fb_count = 1;
  } else {
    config.frame_size = FRAMESIZE_HVGA; // 480x320 
    config.jpeg_quality = 18;
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
    Serial.println("✗ Gateway inacessível!");
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
  }
  
  delay(1000);
  
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);
  client.setBufferSize(40960); // 40KB - margem para SVGA comprimido
  client.setKeepAlive(90); // 90 segundos keepalive
  client.setSocketTimeout(30); // 30 segundos timeout em envios grandes
  
  Serial.println("Configuração MQTT concluída");
  
  connectToMqtt();
  
  Serial.println("\n✓ Sistema pronto!");
  Serial.println("Aguardando comandos MQTT...\n");
}

void loop() {
  if (!client.connected()) {
    connectToMqtt();
  }
  client.loop(); // Mantém a conexão viva

  // Verifica se precisa capturar (fora do callback)
  if (shouldCapture) {
    shouldCapture = false; // Reseta flag
    captureAndSendImage(); 
    client.loop(); // Chama loop novamente logo após o trabalho pesado para evitar disconnect
  }
}
