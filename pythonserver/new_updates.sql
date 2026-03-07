USE gp_erp;


ALTER TABLE violation_types
ADD COLUMN category ENUM('simple','medium','dangerous','severe','administrative','vehicle_impound','license_suspension','court_case') NOT NULL DEFAULT 'simple' AFTER fine;

UPDATE violation_types
SET category = CASE category
    WHEN 'present' THEN 'simple'
    WHEN 'absent' THEN 'medium'
    WHEN 'on_site' THEN 'dangerous'
    WHEN 'in_absentia' THEN 'administrative'
    WHEN 'camera_based' THEN 'court_case'
    ELSE 'simple'
END;

ALTER TABLE violation_types
MODIFY COLUMN category ENUM('simple','medium','dangerous','severe','administrative','vehicle_impound','license_suspension','court_case') NOT NULL DEFAULT 'simple';


CREATE TABLE IF NOT EXISTS clearance_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id_number VARCHAR(20) NOT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (citizen_id_number) REFERENCES citizens(id_number) ON DELETE CASCADE,
    INDEX idx_clearance_citizen (citizen_id_number),
    INDEX idx_clearance_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS violation_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    violation_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE,
    INDEX idx_violation_images_violation (violation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO violation_images (violation_id, image_url)
SELECT id, image_url
FROM violations
WHERE image_url IS NOT NULL AND image_url != '';


ALTER TABLE car_requests
ADD COLUMN request_type ENUM('add', 'transfer') DEFAULT 'add' AFTER registration_date,
ADD COLUMN target_owner_id_number VARCHAR(20) NULL AFTER request_type;

ALTER TABLE car_requests
ADD CONSTRAINT fk_car_requests_target_owner
FOREIGN KEY (target_owner_id_number) REFERENCES citizens(id_number) ON DELETE SET NULL;

CREATE INDEX idx_car_requests_target_owner ON car_requests(target_owner_id_number);
CREATE INDEX idx_car_requests_request_type ON car_requests(request_type);

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


UPDATE violations
SET violation_type_id = NULL
WHERE violation_type_id IS NOT NULL;

DELETE FROM violation_violation_types;
DELETE FROM violation_types;

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
('قيادة مركبة آلية (سنة إنتاج 1976 فأكثر) دون مرآة داخلية ومرآة خارجية على الجانب الأيسر', 50.00, 'simple');
