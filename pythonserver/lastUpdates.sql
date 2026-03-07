USE gp_erp;



ALTER TABLE citizens 
ADD COLUMN email VARCHAR(255) NULL AFTER phone;


CREATE INDEX idx_email ON citizens(email);


ALTER TABLE police_requests 
ADD COLUMN email VARCHAR(255) NULL AFTER phone;





ALTER TABLE violations 
ADD COLUMN source ENUM('manual', 'camera') DEFAULT 'manual' AFTER notes;


ALTER TABLE violations 
MODIFY COLUMN violation_type_id INT NULL;


CREATE TABLE IF NOT EXISTS violation_violation_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    violation_id INT NOT NULL,
    violation_type_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE,
    FOREIGN KEY (violation_type_id) REFERENCES violation_types(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_violation_type (violation_id, violation_type_id),
    INDEX idx_violation (violation_id),
    INDEX idx_violation_type (violation_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT IGNORE INTO violation_violation_types (violation_id, violation_type_id)
SELECT id, violation_type_id 
FROM violations 
WHERE violation_type_id IS NOT NULL;


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


ALTER TABLE violation_types
MODIFY COLUMN category ENUM(
    'present','absent','on_site','in_absentia','camera_based',
    'simple','medium','dangerous','severe','administrative','vehicle_impound','license_suspension','court_case'
) NOT NULL DEFAULT 'simple';

UPDATE violation_types
SET category = CASE category
    WHEN 'present' THEN 'simple'
    WHEN 'absent' THEN 'medium'
    WHEN 'on_site' THEN 'dangerous'
    WHEN 'in_absentia' THEN 'administrative'
    WHEN 'camera_based' THEN 'court_case'
    ELSE category
END;

ALTER TABLE violation_types
MODIFY COLUMN category ENUM('simple','medium','dangerous','severe','administrative','vehicle_impound','license_suspension','court_case') NOT NULL DEFAULT 'simple';

