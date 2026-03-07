from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import json
import hashlib
import os
from werkzeug.utils import secure_filename
import pandas as pd
import io
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random

app = Flask(__name__)
CORS(app)

                                                            
email_verification_codes = {}

UPLOAD_FOLDER = 'violations_images'
CAR_REQUEST_DOCS_FOLDER = 'car_request_documents'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_DOCUMENT_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'pdf'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(CAR_REQUEST_DOCS_FOLDER):
    os.makedirs(CAR_REQUEST_DOCS_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['CAR_REQUEST_DOCS_FOLDER'] = CAR_REQUEST_DOCS_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def allowed_document_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_DOCUMENT_EXTENSIONS


def normalize_violation_image_paths(data):
    if not data:
        return []
    if isinstance(data, str):
        return [data]
    if isinstance(data, list):
        return [item for item in data if isinstance(item, str) and item.strip()]
    return []


def get_violation_images_map(cursor, violation_ids):
    images_map = {}
    if not violation_ids:
        return images_map

    placeholders = ','.join(['%s'] * len(violation_ids))
    cursor.execute(f"""
        SELECT violation_id, image_url
        FROM violation_images
        WHERE violation_id IN ({placeholders})
        ORDER BY id ASC
    """, violation_ids)

    for row in cursor.fetchall():
        vid = row['violation_id']
        if vid not in images_map:
            images_map[vid] = []
        images_map[vid].append(row['image_url'])

    return images_map

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'gp_erp',
    'charset': 'utf8mb4'
}

FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:5173').rstrip('/')

def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(password, hashed_password):
    return hash_password(password) == hashed_password


def is_police_user(cursor, id_number):
    if not id_number:
        return False
    cursor.execute("SELECT role FROM citizens WHERE id_number = %s", (id_number,))
    result = cursor.fetchone()
    return bool(result and result[0] == 'police')


def should_send_violation_email(cursor, source, police_id_number):
    if source == 'camera':
        return True
    return is_police_user(cursor, police_id_number)


def build_violation_details_link(violation_id):
    return f"{FRONTEND_BASE_URL}/violations/{violation_id}"

def send_email(to_email, subject, body):
    if not to_email:
        print(f"No email provided, skipping email send")
        return False
    
    try:
                       
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "gov.traffic.system@gmail.com"
                                                      
        sender_password = "xibu jpud dspl vzat".replace(" ", "").replace("\t", "").strip()
        
                                         
        if not sender_password:
            print("Error: Email password is empty")
            return False
        
                       
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
                             
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
                       
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        
                             
        try:
            server.login(sender_email, sender_password)
        except smtplib.SMTPAuthenticationError as auth_error:
            print(f"SMTP Authentication Error: {str(auth_error)}")
            print(f"Attempted to login with email: {sender_email}")
            print(f"Password length: {len(sender_password)} characters")
            server.quit()
            return False
        
        text = msg.as_string()
        server.sendmail(sender_email, to_email, text)
        server.quit()
        
        print(f"Email sent successfully to {to_email}")
        return True
    except smtplib.SMTPException as smtp_error:
        print(f"SMTP Error sending email: {str(smtp_error)}")
        return False
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

@app.route('/api/citizens/send-email-verification-code', methods=['POST'])
def send_email_verification_code():
    data = request.json
    new_email = data.get('newEmail')
    id_number = data.get('idNumber')
    
    if not new_email or not id_number:
        return jsonify({'error': 'Email and ID number are required'}), 400
    
                           
    import re
    email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_pattern, new_email):
        return jsonify({'error': 'Invalid email format'}), 400
    
                                            
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT id_number FROM citizens WHERE email = %s AND id_number != %s", (new_email, id_number))
        existing = cursor.fetchone()
        if existing:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Email already in use'}), 400
        
                                  
        verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
                                
        email_verification_codes[new_email] = {
            'code': verification_code,
            'timestamp': datetime.now(),
            'id_number': id_number
        }
        
                       
        subject = "كود التحقق لتغيير الإيميل - Email Verification Code"
        body = f"""
عزيزي/عزيزتي المستخدم،

تم طلب تغيير الإيميل الخاص بك. يرجى استخدام الكود التالي للتحقق:

كود التحقق: {verification_code}

هذا الكود صالح لمدة 10 دقائق فقط.

إذا لم تطلب تغيير الإيميل، يرجى تجاهل هذه الرسالة.

مع تحياتنا،
نظام إدارة المرور

---
Dear User,

You have requested to change your email. Please use the following code to verify:

Verification Code: {verification_code}

This code is valid for 10 minutes only.

If you did not request to change your email, please ignore this message.

Best regards,
Traffic Management System
"""
        
        if send_email(new_email, subject, body):
            cursor.close()
            conn.close()
            return jsonify({'message': 'Verification code sent successfully'}), 200
        else:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Failed to send verification email'}), 500
            
    except Error as e:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/citizens/verify-email-code', methods=['POST'])
def verify_email_code():
    data = request.json
    new_email = data.get('newEmail')
    verification_code = data.get('verificationCode')
    id_number = data.get('idNumber')
    
    if not new_email or not verification_code or not id_number:
        return jsonify({'error': 'Email, verification code, and ID number are required'}), 400
    
                     
    if new_email not in email_verification_codes:
        return jsonify({'error': 'Verification code not found or expired'}), 400
    
    stored_data = email_verification_codes[new_email]
    
                         
    if stored_data['id_number'] != id_number:
        return jsonify({'error': 'Invalid request'}), 400
    
                                          
    if datetime.now() - stored_data['timestamp'] > timedelta(minutes=10):
        del email_verification_codes[new_email]
        return jsonify({'error': 'Verification code expired'}), 400
    
                     
    if stored_data['code'] != verification_code:
        return jsonify({'error': 'Invalid verification code'}), 400
    
                   
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("UPDATE citizens SET email = %s WHERE id_number = %s", (new_email, id_number))
        conn.commit()
        
                                 
        del email_verification_codes[new_email]
        
        cursor.close()
        conn.close()
        return jsonify({'message': 'Email updated successfully'}), 200
    except Error as e:
        conn.rollback()
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        if conn:
            conn.rollback()
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/citizens/login', methods=['POST'])
def login():
    data = request.json
    id_number = data.get('idNumber')
    password = data.get('password')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT * FROM citizens 
            WHERE id_number = %s
        """, (id_number,))
        user = cursor.fetchone()
        
        if user and verify_password(password, user['password']):
            if user['date_of_birth']:
                user['date_of_birth'] = user['date_of_birth'].strftime('%Y-%m-%d')
            user['idNumber'] = user.pop('id_number')
            user['dateOfBirth'] = user.pop('date_of_birth')
            user['licenseNumber'] = user.pop('license_number', None)
            user['badgeNumber'] = user.pop('badge_number', None)
            user.pop('password', None)
            return jsonify(user), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/citizens', methods=['GET'])
def get_citizens():
    role = request.args.get('role')
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        if role:
            cursor.execute("SELECT * FROM citizens WHERE role = %s", (role,))
        else:
            cursor.execute("SELECT * FROM citizens")
        
        citizens = cursor.fetchall()
        for citizen in citizens:
            if citizen['date_of_birth']:
                citizen['date_of_birth'] = citizen['date_of_birth'].strftime('%Y-%m-%d')
            citizen['idNumber'] = citizen.pop('id_number')
            citizen['dateOfBirth'] = citizen.pop('date_of_birth')
            citizen['licenseNumber'] = citizen.pop('license_number', None)
            citizen['badgeNumber'] = citizen.pop('badge_number', None)
            citizen['email'] = citizen.pop('email', None)
        
        return jsonify(citizens), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/citizens/<id_number>', methods=['GET'])
def get_citizen(id_number):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM citizens WHERE id_number = %s", (id_number,))
        citizen = cursor.fetchone()
        
        if citizen:
            if citizen['date_of_birth']:
                citizen['date_of_birth'] = citizen['date_of_birth'].strftime('%Y-%m-%d')
            citizen['idNumber'] = citizen.pop('id_number')
            citizen['dateOfBirth'] = citizen.pop('date_of_birth')
            citizen['licenseNumber'] = citizen.pop('license_number', None)
            citizen['badgeNumber'] = citizen.pop('badge_number', None)
            citizen['email'] = citizen.pop('email', None)
                                                        
            default_password_hash = hash_password('00000')
            has_account = citizen.get('password') and citizen['password'] != default_password_hash and citizen['password'] != ''
            citizen['hasAccount'] = has_account
                                           
            if 'password' in citizen:
                del citizen['password']
            return jsonify(citizen), 200
        else:
            return jsonify({'error': 'Citizen not found'}), 404
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/citizens/<id_number>/check-account', methods=['GET'])
def check_citizen_account(id_number):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT password FROM citizens WHERE id_number = %s", (id_number,))
        citizen = cursor.fetchone()
        
        if not citizen:
            return jsonify({'hasAccount': False, 'exists': False}), 200
        
                                                    
        default_password_hash = hash_password('00000')
        has_account = citizen['password'] and citizen['password'] != default_password_hash and citizen['password'] != ''
        
        return jsonify({'hasAccount': has_account, 'exists': True}), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/citizens', methods=['POST'])
def add_citizen():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        password = data.get('password') or '00000'
        password = hash_password(password)
        
        is_update = False
        if data.get('idNumber'):
            cursor.execute("SELECT id_number FROM citizens WHERE id_number = %s", (data.get('idNumber'),))
            is_update = cursor.fetchone() is not None
        
        if is_update:
            cursor.execute("""
                UPDATE citizens SET
                name = %s,
                phone = %s,
                email = %s,
                address = %s,
                date_of_birth = %s,
                gender = %s,
                nationality = %s,
                role = %s,
                license_number = %s
                WHERE id_number = %s
            """, (
                data.get('name'),
                data.get('phone'),
                data.get('email'),
                data.get('address'),
                data.get('dateOfBirth'),
                data.get('gender'),
                data.get('nationality'),
                data.get('role', 'driver'),
                data.get('licenseNumber'),
                data.get('idNumber')
            ))
        else:
            cursor.execute("""
                INSERT INTO citizens (id_number, name, password, phone, email, address, date_of_birth, gender, nationality, role, license_number)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data.get('idNumber'),
                data.get('name'),
                password,
                data.get('phone'),
                data.get('email'),
                data.get('address'),
                data.get('dateOfBirth'),
                data.get('gender'),
                data.get('nationality'),
                data.get('role', 'driver'),
                data.get('licenseNumber')
            ))
        conn.commit()
        return jsonify({'message': 'Citizen added/updated successfully', 'id': cursor.lastrowid}), 201
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/citizens/<id_number>', methods=['PUT'])
def update_citizen(id_number):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        updates = []
        values = []
        
        if 'name' in data:
            updates.append("name = %s")
            values.append(data['name'])
        if 'password' in data:
            updates.append("password = %s")
            values.append(hash_password(data['password']))
        if 'phone' in data:
            updates.append("phone = %s")
            values.append(data['phone'])
        if 'email' in data:
            updates.append("email = %s")
            values.append(data['email'])
        if 'address' in data:
            updates.append("address = %s")
            values.append(data['address'])
        if 'dateOfBirth' in data:
            updates.append("date_of_birth = %s")
            values.append(data['dateOfBirth'])
        if 'gender' in data:
            updates.append("gender = %s")
            values.append(data['gender'])
        if 'nationality' in data:
            updates.append("nationality = %s")
            values.append(data['nationality'])
        if 'role' in data:
            updates.append("role = %s")
            values.append(data['role'])
        if 'licenseNumber' in data:
            updates.append("license_number = %s")
            values.append(data['licenseNumber'])
        if 'badgeNumber' in data:
            updates.append("badge_number = %s")
            values.append(data['badgeNumber'])
        if 'rank' in data:
            updates.append("rank = %s")
            values.append(data['rank'])
        if 'department' in data:
            updates.append("department = %s")
            values.append(data['department'])
        
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        
        values.append(id_number)
        query = f"UPDATE citizens SET {', '.join(updates)} WHERE id_number = %s"
        cursor.execute(query, values)
        conn.commit()
        
        return jsonify({'message': 'Citizen updated successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/citizens/<id_number>', methods=['DELETE'])
def delete_citizen(id_number):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("DELETE FROM citizens WHERE id_number = %s", (id_number,))
        conn.commit()
        return jsonify({'message': 'Citizen deleted successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/citizens/<id_number>/promote', methods=['PUT'])
def promote_police(id_number):
    data = request.json
    new_rank = data.get('rank')
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("""
            UPDATE citizens 
            SET rank = %s 
            WHERE id_number = %s AND role = 'police'
        """, (new_rank, id_number))
        conn.commit()
        return jsonify({'message': 'Rank updated successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/citizens/<id_number>/demote', methods=['PUT'])
def demote_police(id_number):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("""
            UPDATE citizens 
            SET role = 'driver', 
                badge_number = NULL, 
                rank = NULL, 
                department = NULL
            WHERE id_number = %s AND role = 'police'
        """, (id_number,))
        conn.commit()
        return jsonify({'message': 'Officer demoted successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/cars', methods=['GET'])
def get_cars():
    owner_id = request.args.get('ownerIdNumber')
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        if owner_id:
            cursor.execute("SELECT * FROM cars WHERE owner_id_number = %s", (owner_id,))
        else:
            cursor.execute("SELECT * FROM cars")
        
        cars = cursor.fetchall()
        for car in cars:
            if car['registration_date']:
                car['registration_date'] = car['registration_date'].strftime('%Y-%m-%d')
            car['plateNumber'] = car.pop('plate_number')
            car['ownerIdNumber'] = car.pop('owner_id_number')
            car['registrationDate'] = car.pop('registration_date')
        
        return jsonify(cars), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/cars/<plate_number>', methods=['GET'])
def get_car(plate_number):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM cars WHERE plate_number = %s", (plate_number,))
        car = cursor.fetchone()
        
        if car:
            if car['registration_date']:
                car['registration_date'] = car['registration_date'].strftime('%Y-%m-%d')
            car['plateNumber'] = car.pop('plate_number')
            car['ownerIdNumber'] = car.pop('owner_id_number')
            car['registrationDate'] = car.pop('registration_date')
            return jsonify(car), 200
        else:
            return jsonify({'error': 'Car not found'}), 404
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/cars', methods=['POST'])
def add_car():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("""
            INSERT INTO cars (plate_number, owner_id_number, make, model, year, color, registration_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('plateNumber'),
            data.get('ownerIdNumber'),
            data.get('make'),
            data.get('model'),
            data.get('year'),
            data.get('color'),
            data.get('registrationDate')
        ))
        conn.commit()
        return jsonify({'message': 'Car added successfully', 'id': cursor.lastrowid}), 201
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/cars/<car_id>', methods=['PUT'])
def update_car(car_id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("""
            UPDATE cars 
            SET make = %s, model = %s, year = %s, color = %s, registration_date = %s
            WHERE id = %s
        """, (
            data.get('make'),
            data.get('model'),
            data.get('year'),
            data.get('color'),
            data.get('registrationDate'),
            car_id
        ))
        conn.commit()
        return jsonify({'message': 'Car updated successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/cars/<car_id>', methods=['DELETE'])
def delete_car(car_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("DELETE FROM cars WHERE id = %s", (car_id,))
        conn.commit()
        return jsonify({'message': 'Car deleted successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violations', methods=['GET'])
def get_violations():
    citizen_id = request.args.get('citizenIdNumber')
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        if citizen_id:
            cursor.execute("""
                SELECT v.*, c.name as police_name
                FROM violations v
                LEFT JOIN citizens c ON v.police_id_number = c.id_number
                WHERE v.citizen_id_number = %s
                ORDER BY v.id DESC
            """, (citizen_id,))
        else:
            cursor.execute("""
                SELECT v.*, c.name as police_name
                FROM violations v
                LEFT JOIN citizens c ON v.police_id_number = c.id_number
                ORDER BY v.id DESC
            """)
        
        violations = cursor.fetchall()
        violation_ids = [v['id'] for v in violations]
        
                                             
        violation_types_map = {}
        if violation_ids:
            placeholders = ','.join(['%s'] * len(violation_ids))
            cursor.execute(f"""
                SELECT vvt.violation_id, vt.id as type_id, vt.name as type_name, vt.fine, vt.category
                FROM violation_violation_types vvt
                JOIN violation_types vt ON vvt.violation_type_id = vt.id
                WHERE vvt.violation_id IN ({placeholders})
            """, violation_ids)
            
            for row in cursor.fetchall():
                vid = row['violation_id']
                if vid not in violation_types_map:
                    violation_types_map[vid] = []
                violation_types_map[vid].append({
                    'id': row['type_id'],
                    'name': row['type_name'],
                    'fine': float(row['fine']),
                    'category': row.get('category')
                })
        
                         
        violation_images_map = get_violation_images_map(cursor, violation_ids)

        for violation in violations:
            if violation['date']:
                violation['date'] = violation['date'].strftime('%Y-%m-%d')
            if violation['time']:
                violation['time'] = str(violation['time'])
            violation['plateNumber'] = violation.pop('plate_number')
            violation['citizenIdNumber'] = violation.pop('citizen_id_number')
            violation['violationTypeId'] = violation.pop('violation_type_id')                           
            violation['violationTypes'] = violation_types_map.get(violation['id'], [])
                                     
            if violation['violationTypes']:
                violation['violationType'] = violation['violationTypes'][0]['name']
                violation['violationTypeId'] = violation['violationTypes'][0]['id']
            else:
                violation['violationType'] = None
            violation['gps'] = {
                'lat': float(violation.pop('gps_lat')) if violation.get('gps_lat') else None,
                'lng': float(violation.pop('gps_lng')) if violation.get('gps_lng') else None
            }
            legacy_image = violation.pop('image_url', None)
            images = violation_images_map.get(violation['id'], [])
            if not images and legacy_image:
                images = [legacy_image]
            violation['images'] = images
            violation['image'] = images[0] if images else None
            violation['imagePath'] = violation['image']
            violation['policeIdNumber'] = violation.pop('police_id_number', None)
            violation['policeName'] = violation.pop('police_name', None)
            violation['source'] = violation.pop('source', 'manual')
            
            cursor.execute("""
                SELECT status FROM violation_objections 
                WHERE violation_id = %s
            """, (violation['id'],))
            objection = cursor.fetchone()
            violation['objection'] = objection['status'] if objection else None
        
        return jsonify(violations), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violations/<violation_id>', methods=['GET'])
def get_violation(violation_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT v.*, c.name as police_name
            FROM violations v
            LEFT JOIN citizens c ON v.police_id_number = c.id_number
            WHERE v.id = %s
        """, (violation_id,))
        violation = cursor.fetchone()
        
        if violation:
                                      
            cursor.execute("""
                SELECT vt.id as type_id, vt.name as type_name, vt.fine, vt.category
                FROM violation_violation_types vvt
                JOIN violation_types vt ON vvt.violation_type_id = vt.id
                WHERE vvt.violation_id = %s
            """, (violation_id,))
            
            violation_types = []
            for row in cursor.fetchall():
                violation_types.append({
                    'id': row['type_id'],
                    'name': row['type_name'],
                    'fine': float(row['fine']),
                    'category': row.get('category')
                })
            
            cursor.execute("""
                SELECT image_url
                FROM violation_images
                WHERE violation_id = %s
                ORDER BY id ASC
            """, (violation_id,))
            image_rows = cursor.fetchall()
            images = [row['image_url'] for row in image_rows]

            if violation['date']:
                violation['date'] = violation['date'].strftime('%Y-%m-%d')
            if violation['time']:
                violation['time'] = str(violation['time'])
            violation['plateNumber'] = violation.pop('plate_number')
            violation['citizenIdNumber'] = violation.pop('citizen_id_number')
            violation['violationTypes'] = violation_types
                                     
            if violation_types:
                violation['violationTypeId'] = violation_types[0]['id']
                violation['violationType'] = violation_types[0]['name']
            else:
                violation['violationTypeId'] = violation.pop('violation_type_id')
                violation['violationType'] = None
            violation['gps'] = {
                'lat': float(violation.pop('gps_lat')) if violation.get('gps_lat') else None,
                'lng': float(violation.pop('gps_lng')) if violation.get('gps_lng') else None
            }
            legacy_image = violation.pop('image_url', None)
            if not images and legacy_image:
                images = [legacy_image]
            violation['images'] = images
            violation['image'] = images[0] if images else None
            violation['imagePath'] = violation['image']
            violation['policeIdNumber'] = violation.pop('police_id_number', None)
            violation['policeName'] = violation.pop('police_name', None)
            violation['source'] = violation.pop('source', 'manual')
            
            cursor.execute("""
                SELECT status FROM violation_objections 
                WHERE violation_id = %s
            """, (violation['id'],))
            objection = cursor.fetchone()
            violation['objection'] = objection['status'] if objection else None
            
            return jsonify(violation), 200
        else:
            return jsonify({'error': 'Violation not found'}), 404
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violations/upload-image', methods=['POST'])
def upload_violation_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{timestamp}_{filename}"
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        image_path = f"/api/violations-images/{unique_filename}"
        return jsonify({'imagePath': image_path, 'filename': unique_filename}), 200
    else:
        return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif, webp'}), 400

@app.route('/api/violations-images/<filename>')
def serve_violation_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/car-request-documents/<filename>')
def serve_car_request_document(filename):
    return send_from_directory(app.config['CAR_REQUEST_DOCS_FOLDER'], filename)

@app.route('/api/violations', methods=['POST'])
def add_violation():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        image_paths = normalize_violation_image_paths(data.get('imagePaths'))
        if not image_paths:
            image_paths = normalize_violation_image_paths(data.get('images'))
        if not image_paths:
            image_paths = normalize_violation_image_paths(data.get('imagePath') or data.get('image'))

        unique_image_paths = []
        for path in image_paths:
            normalized_path = path.strip()
            if normalized_path and normalized_path not in unique_image_paths:
                unique_image_paths.append(normalized_path)

        primary_image_path = unique_image_paths[0] if unique_image_paths else None
        source = data.get('source', 'manual')                    
        
                                    
        violation_type_ids = data.get('violationTypeIds', [])
        if not violation_type_ids:
                                     
            if data.get('violationTypeId'):
                violation_type_ids = [data.get('violationTypeId')]
            else:
                return jsonify({'error': 'يجب تحديد نوع مخالفة واحد على الأقل'}), 400
        
                             
        total_fine = 0
        violation_types_info = []
        for type_id in violation_type_ids:
            cursor.execute("SELECT id, name, fine FROM violation_types WHERE id = %s", (type_id,))
            type_info = cursor.fetchone()
            if type_info:
                total_fine += float(type_info[2])
                violation_types_info.append({
                    'id': type_info[0],
                    'name': type_info[1],
                    'fine': float(type_info[2])
                })
        
        if not violation_types_info:
            return jsonify({'error': 'أنواع المخالفات المحددة غير صحيحة'}), 400
        
                        
        cursor.execute("""
            INSERT INTO violations (plate_number, citizen_id_number, violation_type_id, fine, date, time, 
                                  location, gps_lat, gps_lng, image_url, police_id_number, status, notes, source)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('plateNumber'),
            data.get('citizenIdNumber'),
            violation_type_ids[0],                           
            total_fine,
            data.get('date'),
            data.get('time'),
            data.get('location'),
            data.get('gps', {}).get('lat'),
            data.get('gps', {}).get('lng'),
            primary_image_path,
            data.get('policeIdNumber'),
            data.get('status', 'unpaid'),
            data.get('notes', ''),
            source
        ))
        conn.commit()
        violation_id = cursor.lastrowid
        
                                               
        for type_id in violation_type_ids:
            cursor.execute("""
                INSERT INTO violation_violation_types (violation_id, violation_type_id)
                VALUES (%s, %s)
            """, (violation_id, type_id))

        for image_path in unique_image_paths:
            cursor.execute("""
                INSERT INTO violation_images (violation_id, image_url)
                VALUES (%s, %s)
            """, (violation_id, image_path))
        conn.commit()
        
                                                      
        try:
            cursor.execute("""
                SELECT c.email, c.name, v.plate_number, v.fine, v.date, v.time, v.location
                FROM violations v
                JOIN citizens c ON v.citizen_id_number = c.id_number
                WHERE v.id = %s
            """, (violation_id,))
            violation_info = cursor.fetchone()

            police_id_number = data.get('policeIdNumber')
            send_email_for_violation = should_send_violation_email(cursor, source, police_id_number)

            if violation_info and violation_info[0] and send_email_for_violation:
                email = violation_info[0]
                citizen_name = violation_info[1]
                plate_number = violation_info[2]
                fine = violation_info[3]
                date = violation_info[4]
                time = violation_info[5]
                location = violation_info[6]

                details_link = build_violation_details_link(violation_id)
                subject = "New traffic violation notice"
                body = f"""
Dear {citizen_name},

There is a new traffic violation on your record.
For more details, click here:
{details_link}

Plate number: {plate_number}
Date: {date}
Time: {time}
Location: {location}
Total fine: {fine} ILS

Traffic Management Department
"""
                send_email(email, subject, body)
        except Exception as email_error:
            print(f"Error sending violation email: {str(email_error)}")
                                                   
        
        return jsonify({
            'message': 'Violation added successfully', 
            'id': violation_id,
            'violationTypes': violation_types_info,
            'totalFine': total_fine,
            'images': unique_image_paths,
            'image': primary_image_path
        }), 201
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violations/<violation_id>/status', methods=['PUT'])
def update_violation_status(violation_id):
    data = request.json
    status = data.get('status')
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        if status == 'exempted':
            cursor.execute("""
                UPDATE violations 
                SET status = 'exempted', fine = 0
                WHERE id = %s
            """, (violation_id,))
        else:
            cursor.execute("""
                UPDATE violations 
                SET status = %s
                WHERE id = %s
            """, (status, violation_id))
        conn.commit()
        return jsonify({'message': 'Violation status updated successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violations/<violation_id>', methods=['DELETE'])
def delete_violation(violation_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("DELETE FROM violations WHERE id = %s", (violation_id,))
        conn.commit()
        return jsonify({'message': 'Violation deleted successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violation-types', methods=['GET'])
def get_violation_types():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM violation_types ORDER BY id DESC")
        types = cursor.fetchall()
        for vtype in types:
            vtype['name'] = vtype['name']
        return jsonify(types), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violation-types', methods=['POST'])
def add_violation_type():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("""
            INSERT INTO violation_types (name, fine, category)
            VALUES (%s, %s, %s)
        """, (
            data.get('name'),
            data.get('fine'),
            data.get('category', 'simple')
        ))
        conn.commit()
        return jsonify({'message': 'Violation type added successfully', 'id': cursor.lastrowid}), 201
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violation-types/<type_id>', methods=['PUT'])
def update_violation_type(type_id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("""
            UPDATE violation_types 
            SET name = %s, fine = %s, category = %s
            WHERE id = %s
        """, (
            data.get('name'),
            data.get('fine'),
            data.get('category', 'simple'),
            type_id
        ))
        conn.commit()
        return jsonify({'message': 'Violation type updated successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violation-types/<type_id>', methods=['DELETE'])
def delete_violation_type(type_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("SELECT COUNT(*) as count FROM violations WHERE violation_type_id = %s", (type_id,))
        result = cursor.fetchone()
        if result and result[0] > 0:
            return jsonify({'error': 'Cannot delete violation type that is used in violations'}), 400
        
        cursor.execute("DELETE FROM violation_types WHERE id = %s", (type_id,))
        conn.commit()
        return jsonify({'message': 'Violation type deleted successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violations/import-excel', methods=['POST'])
def import_violations_excel():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'Invalid file type. Please upload an Excel file (.xlsx or .xls)'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        df = pd.read_excel(file)
        
        required_columns = ['plate_number', 'date', 'time', 'location']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({'error': f'Missing required columns: {", ".join(missing_columns)}'}), 400
        
                                                                
        has_single_type = 'violation_type_id' in df.columns
        has_multiple_types = 'violation_type_ids' in df.columns
        
        if not has_single_type and not has_multiple_types:
            return jsonify({'error': 'Missing required column: violation_type_id or violation_type_ids'}), 400
        
        imported_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                plate_number = str(row['plate_number']).strip()
                date = str(row['date']).strip()
                time = str(row['time']).strip()
                location = str(row['location']).strip()
                gps_lat = float(row.get('gps_lat', 0)) if pd.notna(row.get('gps_lat')) else None
                gps_lng = float(row.get('gps_lng', 0)) if pd.notna(row.get('gps_lng')) else None
                notes = str(row.get('notes', '')).strip() if pd.notna(row.get('notes')) else ''
                source = str(row.get('source', 'camera')).strip() if pd.notna(row.get('source')) else 'camera'
                
                                        
                violation_type_ids = []
                if has_multiple_types and pd.notna(row.get('violation_type_ids')):
                                                                          
                    type_ids_str = str(row['violation_type_ids']).strip()
                    violation_type_ids = [int(tid.strip()) for tid in type_ids_str.split(',') if tid.strip().isdigit()]
                elif has_single_type and pd.notna(row.get('violation_type_id')):
                                             
                    violation_type_ids = [int(row['violation_type_id'])]
                else:
                    errors.append(f'Row {index + 2}: No violation type specified')
                    continue
                
                if not violation_type_ids:
                    errors.append(f'Row {index + 2}: Invalid violation type IDs')
                    continue
                
                                     
                total_fine = 0
                violation_types_info = []
                for type_id in violation_type_ids:
                    cursor.execute("SELECT id, name, fine FROM violation_types WHERE id = %s", (type_id,))
                    type_info = cursor.fetchone()
                    if type_info:
                        total_fine += float(type_info[2])
                        violation_types_info.append({
                            'id': type_info[0],
                            'name': type_info[1],
                            'fine': float(type_info[2])
                        })
                
                if not violation_types_info:
                    errors.append(f'Row {index + 2}: Invalid violation types')
                    continue
                
                cursor.execute("SELECT owner_id_number FROM cars WHERE plate_number = %s", (plate_number,))
                car = cursor.fetchone()
                if not car:
                    errors.append(f'Row {index + 2}: Car with plate {plate_number} not found')
                    continue
                
                citizen_id_number = car[0]
                
                                
                cursor.execute("""
                    INSERT INTO violations (plate_number, citizen_id_number, violation_type_id, fine, date, time,
                                          location, gps_lat, gps_lng, status, notes, source)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'unpaid', %s, %s)
                """, (
                    plate_number,
                    citizen_id_number,
                    violation_type_ids[0],                           
                    total_fine,
                    date,
                    time,
                    location,
                    gps_lat,
                    gps_lng,
                    notes,
                    source
                ))
                violation_id = cursor.lastrowid
                
                                                       
                for type_id in violation_type_ids:
                    cursor.execute("""
                        INSERT INTO violation_violation_types (violation_id, violation_type_id)
                        VALUES (%s, %s)
                    """, (violation_id, type_id))
                
                imported_count += 1
                
                                     
                try:
                    cursor.execute("""
                        SELECT c.email, c.name
                        FROM citizens c
                        WHERE c.id_number = %s
                    """, (citizen_id_number,))
                    citizen_info = cursor.fetchone()

                    send_email_for_violation = should_send_violation_email(cursor, source, None)

                    if citizen_info and citizen_info[0] and send_email_for_violation:
                        email = citizen_info[0]
                        citizen_name = citizen_info[1]
                        details_link = build_violation_details_link(violation_id)

                        subject = "New traffic violation notice"
                        body = f"""
Dear {citizen_name},

There is a new traffic violation on your record.
For more details, click here:
{details_link}

Plate number: {plate_number}
Date: {date}
Time: {time}
Location: {location}
Total fine: {total_fine} ILS

Traffic Management Department
"""
                        send_email(email, subject, body)
                except Exception as email_error:
                    print(f"Error sending violation email for imported violation: {str(email_error)}")
            except Exception as e:
                errors.append(f'Row {index + 2}: {str(e)}')
                continue
        
        conn.commit()
        
        return jsonify({
            'message': f'Successfully imported {imported_count} violations',
            'imported': imported_count,
            'errors': errors
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Error processing Excel file: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violations/<violation_id>/objection', methods=['POST'])
def create_objection(violation_id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("""
            SELECT id FROM violation_objections 
            WHERE violation_id = %s AND citizen_id_number = %s
        """, (violation_id, data.get('citizenIdNumber')))
        existing = cursor.fetchone()
        if existing:
            return jsonify({'error': 'Objection already exists for this violation'}), 400
        
        cursor.execute("""
            INSERT INTO violation_objections (violation_id, citizen_id_number, objection_reason)
            VALUES (%s, %s, %s)
        """, (
            violation_id,
            data.get('citizenIdNumber'),
            data.get('objectionReason')
        ))
        conn.commit()
        return jsonify({'message': 'Objection created successfully', 'id': cursor.lastrowid}), 201
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violations/<violation_id>/objection', methods=['GET'])
def get_objection(violation_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT vo.*, c.name as reviewer_name
            FROM violation_objections vo
            LEFT JOIN citizens c ON vo.reviewed_by = c.id_number
            WHERE vo.violation_id = %s
        """, (violation_id,))
        objection = cursor.fetchone()
        
        if objection:
            if objection['created_at']:
                objection['created_at'] = objection['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if objection['updated_at']:
                objection['updated_at'] = objection['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
            objection['citizenIdNumber'] = objection.pop('citizen_id_number')
            objection['violationId'] = objection.pop('violation_id')
            objection['objectionReason'] = objection.pop('objection_reason')
            objection['reviewedBy'] = objection.pop('reviewed_by')
            objection['reviewNotes'] = objection.pop('review_notes')
            objection['reviewerName'] = objection.pop('reviewer_name', None)
        
        return jsonify(objection), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violations/<violation_id>/objection/approve', methods=['PUT'])
def approve_objection(violation_id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("""
            UPDATE violation_objections 
            SET status = 'approved', 
                reviewed_by = %s,
                review_notes = %s
            WHERE violation_id = %s
        """, (
            data.get('reviewedBy'),
            data.get('reviewNotes', ''),
            violation_id
        ))
        
        cursor.execute("""
            UPDATE violations 
            SET status = 'exempted', fine = 0
            WHERE id = %s
        """, (violation_id,))
        
        conn.commit()
        return jsonify({'message': 'Objection approved and violation exempted'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/violations/<violation_id>/objection/reject', methods=['PUT'])
def reject_objection(violation_id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("""
            UPDATE violation_objections 
            SET status = 'rejected', 
                reviewed_by = %s,
                review_notes = %s
            WHERE violation_id = %s
        """, (
            data.get('reviewedBy'),
            data.get('reviewNotes', ''),
            violation_id
        ))
        conn.commit()
        return jsonify({'message': 'Objection rejected'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/objections', methods=['GET'])
def get_objections():
    status = request.args.get('status')
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        if status:
            cursor.execute("""
                SELECT vo.*, v.plate_number, v.citizen_id_number, vt.name as violation_type,
                       c.name as reviewer_name, c2.name as citizen_name
                FROM violation_objections vo
                JOIN violations v ON vo.violation_id = v.id
                JOIN violation_types vt ON v.violation_type_id = vt.id
                LEFT JOIN citizens c ON vo.reviewed_by = c.id_number
                LEFT JOIN citizens c2 ON vo.citizen_id_number = c2.id_number
                WHERE vo.status = %s
                ORDER BY vo.created_at DESC
            """, (status,))
        else:
            cursor.execute("""
                SELECT vo.*, v.plate_number, v.citizen_id_number, vt.name as violation_type,
                       c.name as reviewer_name, c2.name as citizen_name
                FROM violation_objections vo
                JOIN violations v ON vo.violation_id = v.id
                JOIN violation_types vt ON v.violation_type_id = vt.id
                LEFT JOIN citizens c ON vo.reviewed_by = c.id_number
                LEFT JOIN citizens c2 ON vo.citizen_id_number = c2.id_number
                ORDER BY vo.created_at DESC
            """)
        
        objections = cursor.fetchall()
        for obj in objections:
            if obj['created_at']:
                obj['created_at'] = obj['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if obj['updated_at']:
                obj['updated_at'] = obj['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
            obj['citizenIdNumber'] = obj.pop('citizen_id_number')
            obj['violationId'] = obj.pop('violation_id')
            obj['objectionReason'] = obj.pop('objection_reason')
            obj['reviewedBy'] = obj.pop('reviewed_by')
            obj['reviewNotes'] = obj.pop('review_notes')
            obj['reviewerName'] = obj.pop('reviewer_name', None)
            obj['citizenName'] = obj.pop('citizen_name', None)
            obj['plateNumber'] = obj.pop('plate_number')
            obj['violationType'] = obj.pop('violation_type')
        
        return jsonify(objections), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/clearance-requests', methods=['POST'])
def create_clearance_request():
    data = request.json
    citizen_id = data.get('citizenIdNumber')
    notes = data.get('notes', '')

    if not citizen_id:
        return jsonify({'error': 'Citizen ID number is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT id_number FROM citizens WHERE id_number = %s", (citizen_id,))
        citizen = cursor.fetchone()
        if not citizen:
            return jsonify({'error': 'Citizen not found'}), 404

        cursor.execute("""
            SELECT id FROM clearance_requests
            WHERE citizen_id_number = %s AND status = 'pending'
        """, (citizen_id,))
        existing = cursor.fetchone()
        if existing:
            return jsonify({'error': 'A pending clearance request already exists'}), 400

        cursor.execute("""
            INSERT INTO clearance_requests (citizen_id_number, notes)
            VALUES (%s, %s)
        """, (citizen_id, notes))
        conn.commit()
        return jsonify({'message': 'Clearance request created successfully', 'id': cursor.lastrowid}), 201
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/clearance-requests', methods=['GET'])
def get_clearance_requests():
    status = request.args.get('status')
    citizen_id = request.args.get('citizenIdNumber')

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        conditions = []
        params = []

        if status:
            conditions.append("cr.status = %s")
            params.append(status)
        if citizen_id:
            conditions.append("cr.citizen_id_number = %s")
            params.append(citizen_id)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        cursor.execute(f"""
            SELECT cr.*, c.name as citizen_name, c.phone as citizen_phone, c.email as citizen_email
            FROM clearance_requests cr
            JOIN citizens c ON cr.citizen_id_number = c.id_number
            {where_clause}
            ORDER BY cr.created_at DESC
        """, params)

        requests = cursor.fetchall()
        for req in requests:
            if req.get('created_at'):
                req['created_at'] = req['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if req.get('updated_at'):
                req['updated_at'] = req['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
            req['citizenIdNumber'] = req.pop('citizen_id_number')
            req['citizenName'] = req.pop('citizen_name', None)
            req['citizenPhone'] = req.pop('citizen_phone', None)
            req['citizenEmail'] = req.pop('citizen_email', None)

        return jsonify(requests), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/clearance-requests/<int:request_id>/approve', methods=['PUT'])
def approve_clearance_request(request_id):
    data = request.json or {}
    notes = data.get('notes', None)

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(buffered=True)
    try:
        if notes is not None:
            cursor.execute("""
                UPDATE clearance_requests
                SET status = 'approved', notes = %s, updated_at = NOW()
                WHERE id = %s
            """, (notes, request_id))
        else:
            cursor.execute("""
                UPDATE clearance_requests
                SET status = 'approved', updated_at = NOW()
                WHERE id = %s
            """, (request_id,))

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({'error': 'Clearance request not found'}), 404

        conn.commit()
        return jsonify({'message': 'Clearance request approved'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/clearance-requests/<int:request_id>/reject', methods=['PUT'])
def reject_clearance_request(request_id):
    data = request.json or {}
    notes = data.get('notes', None)

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(buffered=True)
    try:
        if notes is not None:
            cursor.execute("""
                UPDATE clearance_requests
                SET status = 'rejected', notes = %s, updated_at = NOW()
                WHERE id = %s
            """, (notes, request_id))
        else:
            cursor.execute("""
                UPDATE clearance_requests
                SET status = 'rejected', updated_at = NOW()
                WHERE id = %s
            """, (request_id,))

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({'error': 'Clearance request not found'}), 404

        conn.commit()
        return jsonify({'message': 'Clearance request rejected'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/car-requests', methods=['GET'])
def get_car_requests():
    status = request.args.get('status')
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        if status:
            cursor.execute("SELECT * FROM car_requests WHERE status = %s ORDER BY id DESC", (status,))
        else:
            cursor.execute("SELECT * FROM car_requests ORDER BY id DESC")
        
        requests = cursor.fetchall()

        documents_map = {}
        request_ids = [req['id'] for req in requests]
        if request_ids:
            placeholders = ','.join(['%s'] * len(request_ids))
            cursor.execute(f"""
                SELECT id, car_request_id, document_type, file_name, file_path
                FROM car_request_documents
                WHERE car_request_id IN ({placeholders})
                ORDER BY id ASC
            """, request_ids)
            documents = cursor.fetchall()
            for doc in documents:
                request_id = doc['car_request_id']
                if request_id not in documents_map:
                    documents_map[request_id] = []
                documents_map[request_id].append({
                    'id': doc['id'],
                    'documentType': doc['document_type'],
                    'fileName': doc['file_name'],
                    'filePath': doc['file_path']
                })

        for req in requests:
            if req.get('registration_date'):
                req['registration_date'] = req['registration_date'].strftime('%Y-%m-%d')
            if req.get('request_date'):
                req['request_date'] = req['request_date'].strftime('%Y-%m-%d')
            req['ownerIdNumber'] = req.pop('owner_id_number')
            req['plateNumber'] = req.pop('plate_number')
            req['registrationDate'] = req.pop('registration_date', None)
            req['requestDate'] = req.pop('request_date')
            req['requestType'] = req.pop('request_type', 'add') if 'request_type' in req else 'add'
            req['targetOwnerIdNumber'] = req.pop('target_owner_id_number', None) if 'target_owner_id_number' in req else None
            req['documents'] = documents_map.get(req['id'], [])
            req['documentCount'] = len(req['documents'])
        
        print(f"Returning {len(requests)} car requests")
        return jsonify(requests), 200
    except Error as e:
        print(f"Error getting car requests: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/car-requests', methods=['POST'])
def add_car_request():
    try:
        data = request.json if request.is_json else request.form.to_dict()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        request_type = data.get('requestType', 'add')
        owner_id = data.get('ownerIdNumber')
        plate_number = data.get('plateNumber')
        uploaded_documents = request.files.getlist('documents') if not request.is_json else []
        document_types = request.form.getlist('documentTypes') if not request.is_json else []

        if not owner_id or not plate_number:
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True, buffered=True)
        try:
            created_request_id = None
            if request_type == 'transfer':
                target_owner_id = data.get('targetOwnerIdNumber')
                if not target_owner_id:
                    return jsonify({'error': 'Target owner ID is required for transfer request'}), 400
                if target_owner_id == owner_id:
                    return jsonify({'error': 'Cannot transfer ownership to the same owner'}), 400

                if not uploaded_documents:
                    return jsonify({'error': 'Transfer request requires supporting documents'}), 400

                normalized_doc_types = [doc_type.strip() for doc_type in document_types if doc_type and doc_type.strip()]
                required_doc_types = {'driving_license', 'vehicle_license'}
                if not required_doc_types.issubset(set(normalized_doc_types)):
                    return jsonify({'error': 'Driving license and vehicle license documents are required'}), 400

                cursor.execute("SELECT id_number FROM citizens WHERE id_number = %s", (target_owner_id,))
                target_citizen = cursor.fetchone()
                if not target_citizen:
                    return jsonify({'error': 'Target owner not found'}), 404

                cursor.execute("""
                    SELECT plate_number, make, model, year, color, registration_date
                    FROM cars
                    WHERE plate_number = %s AND owner_id_number = %s
                """, (plate_number, owner_id))
                car = cursor.fetchone()
                if not car:
                    return jsonify({'error': 'Car not found or not owned by requester'}), 404

                cursor.execute("""
                    INSERT INTO car_requests (
                        owner_id_number,
                        plate_number,
                        make,
                        model,
                        year,
                        color,
                        registration_date,
                        request_type,
                        target_owner_id_number,
                        request_date
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    owner_id,
                    plate_number,
                    car.get('make'),
                    car.get('model'),
                    car.get('year'),
                    car.get('color'),
                    car.get('registration_date'),
                    'transfer',
                    target_owner_id,
                    datetime.now().date()
                ))

                created_request_id = cursor.lastrowid
                for index, file in enumerate(uploaded_documents):
                    if not file or not file.filename:
                        continue
                    if not allowed_document_file(file.filename):
                        conn.rollback()
                        return jsonify({'error': 'Invalid document type. Allowed: png, jpg, jpeg, webp, pdf'}), 400

                    doc_type = normalized_doc_types[index] if index < len(normalized_doc_types) else 'other'
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
                    original_name = secure_filename(file.filename)
                    unique_filename = f"{created_request_id}_{doc_type}_{timestamp}_{original_name}"
                    file_path = os.path.join(app.config['CAR_REQUEST_DOCS_FOLDER'], unique_filename)
                    file.save(file_path)

                    cursor.execute("""
                        INSERT INTO car_request_documents (car_request_id, document_type, file_name, file_path)
                        VALUES (%s, %s, %s, %s)
                    """, (
                        created_request_id,
                        doc_type,
                        original_name,
                        f"/api/car-request-documents/{unique_filename}"
                    ))
            else:
                if not data.get('make') or not data.get('model'):
                    return jsonify({'error': 'Missing required fields'}), 400

                cursor.execute("""
                    INSERT INTO car_requests (
                        owner_id_number,
                        plate_number,
                        make,
                        model,
                        year,
                        color,
                        registration_date,
                        request_date
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    owner_id,
                    plate_number,
                    data.get('make'),
                    data.get('model'),
                    data.get('year'),
                    data.get('color'),
                    data.get('registrationDate'),
                    datetime.now().date()
                ))
                created_request_id = cursor.lastrowid

            conn.commit()
            request_id = created_request_id
            print(f"Car request added successfully with ID: {request_id}")
            return jsonify({'message': 'Car request added successfully', 'id': request_id}), 201
        except Error as e:
            conn.rollback()
            print(f"Database error: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Error in add_car_request: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/car-requests/<request_id>/approve', methods=['PUT'])
def approve_car_request(request_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT * FROM car_requests WHERE id = %s", (request_id,))
        request_data = cursor.fetchone()
        
        if not request_data:
            return jsonify({'error': 'Request not found'}), 404

        request_type = request_data.get('request_type', 'add')
        if request_type == 'transfer':
            cursor.execute("""
                UPDATE cars
                SET owner_id_number = %s
                WHERE plate_number = %s AND owner_id_number = %s
            """, (
                request_data.get('target_owner_id_number'),
                request_data.get('plate_number'),
                request_data.get('owner_id_number')
            ))

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({'error': 'Car not found for transfer approval'}), 404
        else:
            cursor.execute("""
                INSERT INTO cars (plate_number, owner_id_number, make, model, year, color, registration_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                request_data.get('plate_number'),
                request_data.get('owner_id_number'),
                request_data.get('make'),
                request_data.get('model'),
                request_data.get('year'),
                request_data.get('color'),
                request_data.get('registration_date')
            ))
        
        cursor.execute("UPDATE car_requests SET status = 'approved' WHERE id = %s", (request_id,))
        conn.commit()
        return jsonify({'message': 'Car request approved successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/car-requests/<request_id>/reject', methods=['PUT'])
def reject_car_request(request_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("UPDATE car_requests SET status = 'rejected' WHERE id = %s", (request_id,))
        conn.commit()
        return jsonify({'message': 'Car request rejected successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/car-requests/<request_id>', methods=['DELETE'])
def delete_car_request(request_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("DELETE FROM car_requests WHERE id = %s", (request_id,))
        conn.commit()
        return jsonify({'message': 'Car request deleted successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/police-requests', methods=['GET'])
def get_police_requests():
    status = request.args.get('status')
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        if status:
            cursor.execute("SELECT * FROM police_requests WHERE status = %s", (status,))
        else:
            cursor.execute("SELECT * FROM police_requests")
        
        requests = cursor.fetchall()
        for req in requests:
            if req['request_date']:
                req['request_date'] = req['request_date'].strftime('%Y-%m-%d')
            req['idNumber'] = req.pop('id_number')
            req['badgeNumber'] = req.pop('badge_number', None)
            req['email'] = req.pop('email', None)
            req['requestDate'] = req.pop('request_date')
        
        return jsonify(requests), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/police-requests', methods=['POST'])
def add_police_request():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        password = data.get('password')
        if password:
            password = hash_password(password)
        
        cursor.execute("""
            INSERT INTO police_requests (id_number, name, phone, email, password, badge_number, rank, department, request_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('idNumber'),
            data.get('name'),
            data.get('phone'),
            data.get('email'),
            password,
            data.get('badgeNumber'),
            data.get('rank'),
            data.get('department'),
            datetime.now().date()
        ))
        conn.commit()
        return jsonify({'message': 'Police request added successfully', 'id': cursor.lastrowid}), 201
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/police-requests/<request_id>/approve', methods=['PUT'])
def approve_police_request(request_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM police_requests WHERE id = %s", (request_id,))
        request_data = cursor.fetchone()
        
        if not request_data:
            return jsonify({'error': 'Request not found'}), 404
        
        cursor.execute("""
            UPDATE citizens 
            SET role = 'police', 
                password = %s,
                badge_number = %s,
                rank = %s,
                department = %s,
                email = %s
            WHERE id_number = %s
        """, (
            request_data['password'],
            request_data['badge_number'],
            request_data['rank'] or 'عريف',
            request_data['department'] or 'مرور عام',
            request_data.get('email'),
            request_data['id_number']
        ))
        
        cursor.execute("UPDATE police_requests SET status = 'approved' WHERE id = %s", (request_id,))
        conn.commit()
        return jsonify({'message': 'Police request approved successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/police-requests/<request_id>/reject', methods=['PUT'])
def reject_police_request(request_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("UPDATE police_requests SET status = 'rejected' WHERE id = %s", (request_id,))
        conn.commit()
        return jsonify({'message': 'Police request rejected successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/police-requests/<request_id>', methods=['DELETE'])
def delete_police_request(request_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("DELETE FROM police_requests WHERE id = %s", (request_id,))
        conn.commit()
        return jsonify({'message': 'Police request deleted successfully'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
