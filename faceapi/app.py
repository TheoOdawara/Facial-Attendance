from flask import Flask, request, jsonify
import face_recognition
import numpy as np
import base64
import cv2
import json
import os

app = Flask(__name__)

# Diretório para armazenar encodings de faces conhecidas
ENCODINGS_FILE = 'face_encodings.json'

def load_known_faces():
    """Carrega encodings de faces conhecidas do arquivo JSON"""
    if os.path.exists(ENCODINGS_FILE):
        with open(ENCODINGS_FILE, 'r') as f:
            data = json.load(f)
            # Converte listas de volta para numpy arrays
            for student_id in data:
                data[student_id]['encoding'] = np.array(data[student_id]['encoding'])
            return data
    return {}

def save_known_faces(known_faces):
    """Salva encodings de faces conhecidas no arquivo JSON"""
    data = {}
    for student_id, info in known_faces.items():
        data[student_id] = {
            'name': info['name'],
            'encoding': info['encoding'].tolist()  # Converte numpy array para lista
        }
    with open(ENCODINGS_FILE, 'w') as f:
        json.dump(data, f)

@app.route('/register', methods=['POST'])
def register():
    """
    Registra uma nova face de aluno.
    Espera: student_id, name, image (base64)
    """
    try:
        data = request.json
        student_id = str(data.get('student_id'))
        name = data.get('name')
        image_base64 = data.get('image')
        
        if not all([student_id, name, image_base64]):
            return jsonify({'error': 'student_id, name e image são obrigatórios'}), 400
        
        # Decodifica imagem base64
        img_bytes = base64.b64decode(image_base64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detecta faces e gera encoding
        face_locations = face_recognition.face_locations(rgb_image)
        
        if len(face_locations) == 0:
            return jsonify({'error': 'Nenhuma face detectada na imagem'}), 400
        
        if len(face_locations) > 1:
            return jsonify({'error': 'Múltiplas faces detectadas. Envie apenas uma face por vez.'}), 400
        
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        face_encoding = face_encodings[0]
        
        # Carrega faces conhecidas e adiciona nova
        known_faces = load_known_faces()
        known_faces[student_id] = {
            'name': name,
            'encoding': face_encoding
        }
        save_known_faces(known_faces)
        
        return jsonify({
            'success': True,
            'message': f'Face de {name} registrada com sucesso',
            'student_id': student_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/recognize', methods=['POST'])
def recognize():
    """
    Reconhece uma face na imagem fornecida.
    Espera: image (base64 ou arquivo)
    Retorna: recognized, student_id, confidence
    """
    try:
        # Verifica se há faces cadastradas
        known_faces = load_known_faces()
        if not known_faces:
            return jsonify({
                'recognized': False,
                'student_id': None,
                'confidence': 0.0,
                'message': 'Nenhuma face cadastrada no sistema'
            })
        
        # Recebe imagem (base64 ou file)
        if request.json and 'image' in request.json:
            image_base64 = request.json['image']
            img_bytes = base64.b64decode(image_base64)
        elif 'image' in request.files:
            img_bytes = request.files['image'].read()
        else:
            return jsonify({'error': 'Nenhuma imagem fornecida'}), 400
        
        # Decodifica imagem
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None or image.size == 0:
            print(f"ERRO: Imagem vazia ou corrompida. Tamanho dos bytes: {len(img_bytes)}")
            return jsonify({
                'recognized': False,
                'student_id': None,
                'confidence': 0.0,
                'message': 'Imagem corrompida ou vazia'
            })
        
        print(f"✓ Imagem decodificada: {image.shape}")
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detecta faces
        face_locations = face_recognition.face_locations(rgb_image)
        
        if len(face_locations) == 0:
            return jsonify({
                'recognized': False,
                'student_id': None,
                'confidence': 0.0,
                'message': 'Nenhuma face detectada'
            })
        
        # Gera encoding da face detectada
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        unknown_encoding = face_encodings[0]
        
        # Compara com faces conhecidas
        known_ids = list(known_faces.keys())
        known_encodings = [known_faces[sid]['encoding'] for sid in known_ids]
        
        matches = face_recognition.compare_faces(known_encodings, unknown_encoding, tolerance=0.6)
        face_distances = face_recognition.face_distance(known_encodings, unknown_encoding)
        
        if True in matches:
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                student_id = known_ids[best_match_index]
                confidence = 1 - face_distances[best_match_index]
                
                # Remove prefixo temp_ se existir
                if str(student_id).startswith('temp_'):
                    return jsonify({
                        'recognized': False,
                        'student_id': None,
                        'confidence': 0.0,
                        'message': 'Aluno com registro temporário, aguarde atualização'
                    })
                
                # Converte student_id para int, tratando possíveis strings
                try:
                    student_id_int = int(student_id)
                except (ValueError, TypeError):
                    student_id_int = student_id
                
                return jsonify({
                    'recognized': True,
                    'student_id': student_id_int,
                    'student_name': known_faces[student_id]['name'],
                    'confidence': float(confidence)
                })
        
        return jsonify({
            'recognized': False,
            'student_id': None,
            'confidence': 0.0,
            'message': 'Face não reconhecida'
        })
    
    except Exception as e:
        print(f"ERRO no reconhecimento: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
