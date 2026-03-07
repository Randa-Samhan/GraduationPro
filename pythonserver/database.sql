
CREATE DATABASE IF NOT EXISTS gp_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gp_erp;


CREATE TABLE IF NOT EXISTS citizens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(500),
    date_of_birth DATE,
    gender ENUM('ذكر', 'أنثى') DEFAULT 'ذكر',
    nationality VARCHAR(100) DEFAULT 'فلسطيني',
    role ENUM('driver', 'police', 'interior', 'transport', 'court', 'traffic') DEFAULT 'driver',
    license_number VARCHAR(50),
    badge_number VARCHAR(50),
    rank VARCHAR(50),
    department VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_id_number (id_number),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    owner_id_number VARCHAR(20) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(50),
    registration_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id_number) REFERENCES citizens(id_number) ON DELETE CASCADE,
    INDEX idx_plate_number (plate_number),
    INDEX idx_owner (owner_id_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS violation_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    fine DECIMAL(10, 2) NOT NULL,
    category ENUM('simple','medium','dangerous','severe','administrative','vehicle_impound','license_suspension','court_case') NOT NULL DEFAULT 'simple',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL,
    citizen_id_number VARCHAR(20) NOT NULL,
    violation_type_id INT NOT NULL,
    fine DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(500),
    gps_lat DECIMAL(10, 8),
    gps_lng DECIMAL(11, 8),
    image_url VARCHAR(500),
    police_id_number VARCHAR(20),
    status ENUM('unpaid', 'paid', 'exempted') DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (violation_type_id) REFERENCES violation_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (citizen_id_number) REFERENCES citizens(id_number) ON DELETE RESTRICT,
    FOREIGN KEY (police_id_number) REFERENCES citizens(id_number) ON DELETE SET NULL,
    INDEX idx_plate_number (plate_number),
    INDEX idx_citizen (citizen_id_number),
    INDEX idx_police (police_id_number),
    INDEX idx_status (status),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS violation_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    violation_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE,
    INDEX idx_violation_images_violation (violation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS car_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id_number VARCHAR(20) NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(50),
    registration_date DATE,
    request_type ENUM('add', 'transfer') DEFAULT 'add',
    target_owner_id_number VARCHAR(20) NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    request_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id_number) REFERENCES citizens(id_number) ON DELETE CASCADE,
    FOREIGN KEY (target_owner_id_number) REFERENCES citizens(id_number) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_owner (owner_id_number),
    INDEX idx_target_owner (target_owner_id_number),
    INDEX idx_request_type (request_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS car_request_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    car_request_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_request_id) REFERENCES car_requests(id) ON DELETE CASCADE,
    INDEX idx_car_request_documents_request (car_request_id),
    INDEX idx_car_request_documents_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS police_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_number VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    badge_number VARCHAR(50),
    rank VARCHAR(50),
    department VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    request_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_number) REFERENCES citizens(id_number) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_id_number (id_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO violation_types (name, fine, category) VALUES
('سياقة مركبة دون تأمين ساري المفعول', 750.00, 'administrative'),
('استخدام لوحات اختبار دون الحصول على التراخيص اللازمة', 750.00, 'administrative'),
('استعمال لوحات الاختبار في غير الغرض الذي تحدده اللائحة', 750.00, 'administrative'),
('قيادة مركبة دون حيازة رخصة سياقة سارية المفعول لنفس نوع المركبة', 750.00, 'administrative'),
('عدم التوقف التام قبل ملتقى سكة حديد عند اقتراب قطار أو سماع صافرة أو إشارة إنذار', 750.00, 'dangerous'),
('عدم التقيد بالشروط الواردة في رخصة المركبة', 500.00, 'administrative'),
('قيادة مركبة على الجانب الأيسر من المساحة الفاصلة', 500.00, 'dangerous'),
('عدم إعطاء الإشارة قبل البدء بالسير أو التحول عن المسلك أو التوقف', 500.00, 'medium'),
('تسيير مركبة مسجلة ومرخصة دون وضع لوحات التمييز المقررة عليها', 300.00, 'administrative'),
('تسيير مركبة مسجلة ومرخصة تحمل لوحات تمييز مغايرة للوحات المقررة', 300.00, 'administrative'),
('تسيير مركبة مسجلة دون فحصها فنياً في مؤسسة مرخصة لفحص المركبات', 300.00, 'administrative'),
('وقوف مركبة في مكان يُمنع الوقوف فيه أو تعيق فيه حركة السير وتم إبعادها (جرها بواسطة مركبة جر وتخليص)', 300.00, 'medium'),
('تغطية أو طلاء أو رش أو إلصاق مادة على الزجاج تحد أو تحجب الرؤية دون إذن من سلطة الترخيص', 300.00, 'medium'),
('التحول عن مسلك السير مع تشكيل خطر', 300.00, 'dangerous'),
('تجاوز السرعة القصوى المسموح بها لغاية 30 كم/ساعة خلافاً للجدول الملحق', 300.00, 'dangerous'),
('تجاوز السرعة المدونة في الشاخصة لغاية 30 كم/ساعة', 300.00, 'dangerous'),
('إذا انتهى مفعول رخصة المركبة لمدة تقل عن ستة أشهر من تاريخ انتهاء سريانها', 150.00, 'administrative'),
('عدم إبلاغ سلطة الترخيص عن تغيير في بيانات رخصة المركبة', 150.00, 'administrative'),
('تسيير مركبة مع وضع إضافات على جسمها أو هيكلها أو ملحقاتها دون الحصول على إذن من سلطة الترخيص', 150.00, 'administrative'),
('إذا انتهى مفعول رخصة السياقة لمدة تقل عن ستة أشهر بعد تاريخ انتهاء سريانها', 150.00, 'administrative'),
('سياقة مركبة بصورة تعرض حياة الأشخاص أو الأموال للخطر أو إعاقة وعرقلة حركة السير', 150.00, 'dangerous'),
('قيادة مركبة دون الإلمام بتشغيلها واستعمالها', 150.00, 'simple'),
('قيادة مركبة في حالة صحية من شأنها تعريض عابري الطريق للخطر', 150.00, 'dangerous'),
('دخول سائق المركبة لمفترق/السير فيه من مسلك موسوم بأسهم وغير محدد لاتجاه سيره', 150.00, 'medium'),
('السير بمركبة أو حيوان على الرصيف ليس لغرض الدخول إلى أو الخروج من فناء أو كراج', 150.00, 'medium'),
('وقوف مركبة في مكان يُمنع الوقوف فيه وتقييدها بالقيد المخصص لذلك', 150.00, 'simple'),
('قيادة مركبة (حتى 4000 كغم، سنة 1986+) دون استخدام السائق لحزام الأمان', 150.00, 'simple'),
('قيادة مركبة (حتى 4000 كغم، سنة 1986+) دون استخدام الركاب لأحزمة الأمان', 150.00, 'simple'),
('عدم إبراز رخصة مركبة أو وثيقة تأمينها أو رخصة قيادة', 150.00, 'administrative'),
('قيادة مركبة آلية مركب فيها زامور هوائي أو موسيقي دون إذن من سلطة الترخيص', 150.00, 'simple'),
('قيادة مركبة ثقيلة/حافلة/جرار دون جهاز تنبيه آلي عند استعمال غيار الرجوع للخلف (صوت متقطع)', 150.00, 'medium'),
('نقل راكب على جرار صغير دون إذن من سلطة الترخيص', 150.00, 'simple'),
('قيادة جرار صغير دون خوذة واقية للسائق والراكب', 150.00, 'simple'),
('التحول عن مسلك السير مع تشكيل إعاقة', 150.00, 'simple'),
('إطلاق إشارة تنبيه بواسطة ضوء أو جرس أو أية وسيلة أخرى بدون ترخيص من سلطة الترخيص', 150.00, 'simple'),
('تركيب ضوء متقطع/إشارة تنبيه في مركبة غير مخولة (ليست أمن/عمل/قطر وتخليص/مرافقة/حمولة بارزة)', 150.00, 'simple'),
('استعمال الزامور للتنبيه بصورة متواصلة أو متكررة بما يتجاوز الضرورة', 150.00, 'simple'),
('عدم التخفيف من سرعة المركبة قرب حشد من الناس/الأولاد وتعريض عابري الطريق والممتلكات للخطر', 150.00, 'dangerous'),
('عدم التخفيف من سرعة المركبة في منحدر شديد وطويل وتعريض عابري الطريق والممتلكات للخطر', 150.00, 'dangerous'),
('عدم التخفيف من سرعة المركبة عند الاقتراب من جسر ضيق أو السير عليه وتعريض عابري الطريق للخطر', 150.00, 'dangerous'),
('عدم المحافظة على مسافة كافية من المركبة التي تسير في الأمام', 150.00, 'dangerous'),
('التوقف الفجائي (الفرملة الفجائية) دون ضرورة', 150.00, 'dangerous'),
('قيادة مركبة على طريق غير مخصصة لنوعها', 50.00, 'simple'),
('قيادة مركبة آلية دون ماسحات زجاج', 50.00, 'simple'),
('قيادة مركبة وزنها الإجمالي لغاية 2000 كغم دون جهاز لرش الماء على الزجاج الأمامي', 50.00, 'simple'),
('قيادة مركبة ذات زجاج أمامي دون وجود حاجبان واقيان من أشعة الشمس', 50.00, 'simple'),
('قيادة مركبة آلية دون وجود آلة تنبيه كهربائية (زامور)', 50.00, 'simple'),
('قيادة مركبة آلية (سنة إنتاج أقل من 1976) دون مرآة داخل المركبة أو خارجية على جانبها الأيسر', 50.00, 'simple'),
('قيادة مركبة آلية (سنة إنتاج 1976 فأكثر) دون مرآة داخلية ومرآة خارجية على الجانب الأيسر', 50.00, 'simple')
ON DUPLICATE KEY UPDATE name=name;


INSERT INTO citizens (id_number, name, password, phone, address, date_of_birth, gender, nationality, role, license_number) VALUES
('123456789', 'أحمد محمد المصري', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '0599123456', 'نابلس، حي رفيديا', '1990-05-15', 'ذكر', 'فلسطيني', 'driver', 'DL001234'),
('987654321', 'فاطمة أحمد الخطيب', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '0599234567', 'القدس، حي الشيخ جراح', '1992-08-20', 'أنثى', 'فلسطيني', 'driver', 'DL002345'),
('456789123', 'خالد محمود عودة', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '0599345678', 'رام الله، حي البيرة', '1988-03-10', 'ذكر', 'فلسطيني', 'driver', 'DL003456')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO citizens (id_number, name, password, phone, address, date_of_birth, gender, nationality, role, badge_number, rank, department) VALUES
('111222333', 'أحمد المصري', 'd02d3f0959eb1296ac002f10d9183bb8ec9ece3bc02309b7557dfe4758e2feed', '0599111111', 'نابلس', '1985-01-10', 'ذكر', 'فلسطيني', 'police', 'P001', 'رقيب', 'مرور نابلس'),
('444555666', 'سارة الخطيب', 'd02d3f0959eb1296ac002f10d9183bb8ec9ece3bc02309b7557dfe4758e2feed', '0599222222', 'القدس', '1990-06-15', 'أنثى', 'فلسطيني', 'police', 'P002', 'عريف', 'مرور القدس'),
('777888999', 'محمد عودة', 'd02d3f0959eb1296ac002f10d9183bb8ec9ece3bc02309b7557dfe4758e2feed', '0599333333', 'رام الله', '1987-03-20', 'ذكر', 'فلسطيني', 'police', 'P003', 'رقيب أول', 'مرور رام الله')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO citizens (id_number, name, password, phone, address, date_of_birth, gender, nationality, role) VALUES
('000000000', 'مدير وزارة الداخلية', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', '0599000000', 'رام الله', '1980-01-01', 'ذكر', 'فلسطيني', 'interior'),
('111111111', 'مدير وزارة النقل', '8f07c171cca776c146d53d8b4184f27e12b730b76e8a291bbb96a415a29d5f13', '0599111111', 'رام الله', '1982-01-01', 'ذكر', 'فلسطيني', 'transport'),
('222222222', 'قاضي المحكمة', 'db3587a288fa1426d3d2726debf7adf04450eb8aa313f682c9093d8e6351afce', '0599222222', 'رام الله', '1975-01-01', 'ذكر', 'فلسطيني', 'court'),
('333333333', 'مدير إدارة المرور', 'a4689274c7b7bca880ee59ad1b51b7f14ef9212d9e6658d64811ec0c75ae3c71', '0599333333', 'رام الله', '1980-01-01', 'ذكر', 'فلسطيني', 'traffic')
ON DUPLICATE KEY UPDATE name=name;


INSERT INTO cars (plate_number, owner_id_number, make, model, year, color, registration_date) VALUES
('12345-6', '123456789', 'تويوتا', 'كامري', 2020, 'أبيض', '2020-01-15'),
('23456-7', '123456789', 'هوندا', 'أكورد', 2019, 'أسود', '2019-05-20'),
('34567-8', '987654321', 'نيسان', 'التيما', 2021, 'أزرق', '2021-03-10'),
('45678-9', '456789123', 'هيونداي', 'إلنترا', 2022, 'رمادي', '2022-07-05')
ON DUPLICATE KEY UPDATE make=make;


INSERT INTO violations (plate_number, citizen_id_number, violation_type_id, fine, date, time, location, gps_lat, gps_lng, image_url, police_id_number, status, notes) VALUES
('12345-6', '123456789', 1, 300, '2024-01-15', '14:30:00', 'شارع عصيرة الشمالية، نابلس', 32.2348, 35.2603, 'https://via.placeholder.com/400x300?text=Violation+1', '111222333', 'unpaid', 'تجاوز السرعة ب 20 كم/ساعة'),
('12345-6', '123456789', 2, 150, '2024-01-20', '09:15:00', 'شارع رفيديا، نابلس', 32.2271, 35.2220, 'https://via.placeholder.com/400x300?text=Violation+2', '111222333', 'paid', ''),
('34567-8', '987654321', 3, 500, '2024-01-25', '16:45:00', 'شارع صلاح الدين، القدس', 31.7833, 35.2333, 'https://via.placeholder.com/400x300?text=Violation+3', '444555666', 'unpaid', 'تم رصد السائق وهو يستخدم الهاتف'),
('45678-9', '456789123', 4, 1000, '2024-02-01', '11:20:00', 'مفترق السلواد، رام الله', 31.9038, 35.2160, 'https://via.placeholder.com/400x300?text=Violation+4', '777888999', 'unpaid', 'تجاوز الإشارة الحمراء بسرعة عالية'),
('23456-7', '123456789', 5, 200, '2024-02-05', '13:10:00', 'شارع البحر، غزة', 31.5216, 34.4500, 'https://via.placeholder.com/400x300?text=Violation+5', '111222333', 'unpaid', '');


INSERT IGNORE INTO violation_images (violation_id, image_url)
SELECT id, image_url
FROM violations
WHERE image_url IS NOT NULL AND image_url != '';

