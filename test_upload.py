import requests

# Cria uma imagem fake de 10KB
fake_image = b'\xFF\xD8\xFF\xE0' + (b'\x00' * 10000) + b'\xFF\xD9'

files = {'image': ('test.jpg', fake_image, 'image/jpeg')}
response = requests.post('http://localhost:3001/api/esp32/upload-image', files=files)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
