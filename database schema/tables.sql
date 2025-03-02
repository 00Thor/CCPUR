CREATE TABLE users (
user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name VARCHAR(300) NOT NULL,
email VARCHAR(200) UNIQUE NOT NULL,
program varchar(150),
password varchar(250) NOT NULL,
role VARCHAR(50) NOT NULL DEFAULT 'student'
);


// table schema for student_details

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE student_details (
    student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session VARCHAR(50),
    full_name VARCHAR(100),
    date_of_birth DATE,
    aadhaar_no VARCHAR(12) NOT NULL UNIQUE,
    sex VARCHAR(10),
    category VARCHAR(50),
    nationality VARCHAR(50),
    religion VARCHAR(50),
    name_of_community VARCHAR(50),
    contact_no VARCHAR(15),
    blood_group VARCHAR(5),
    email VARCHAR(100) UNIQUE,
    fathers_name VARCHAR(100),
    fathers_occupation VARCHAR(100),
    mothers_name VARCHAR(100),
    mothers_occupation VARCHAR(100),
    permanent_address TEXT,
    present_address TEXT,
    guardian_name VARCHAR(100),
    guardian_address TEXT,
    hslc_board VARCHAR(50),
    hslc_rollno VARCHAR(20),
    hslc_year INTEGER,
    hslc_div VARCHAR(10),
    hslc_tmarks INTEGER,
    hslc_inst VARCHAR(100),
    classxii_board VARCHAR(50),
    classxii_rollno VARCHAR(20),
    classxii_year INTEGER,
    classxii_div VARCHAR(10),
    classxii_tmarks INTEGER,
    classxii_inst VARCHAR(100),
    course VARCHAR(100),
    mil VARCHAR(50),
    subject VARCHAR(100),
    registration_no VARCHAR(100),
    course_code VARCHAR(50),
    current_semester VARCHAR(50),
    roll_no VARCHAR(20) UNIQUE,
    user_id UUID,
    agree BOOLEAN,
    pincode varchar(20),
    admission_date DATE  
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE student_examinations (
    examination_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_details(student_id) ON DELETE CASCADE,
    application_for VARCHAR(100),
    examination_session VARCHAR(50),
    abc_id VARCHAR(50) UNIQUE,
    registration_no VARCHAR(100) UNIQUE,
    of_year VARCHAR(50),
    roll_no VARCHAR(50) UNIQUE,
    dept_code VARCHAR(50),
    fathers_name VARCHAR(255),
    guardian_name VARCHAR(255),
    permanent_address TEXT,
    course_code VARCHAR(50),
    year_semester VARCHAR(50),
    sex VARCHAR(10),
    category VARCHAR(50),
    papercode_a VARCHAR(50), paperno_a VARCHAR(50),
    papercode_b VARCHAR(50), paperno_b VARCHAR(50),
    papercode_c VARCHAR(50), paperno_c VARCHAR(50),
    papercode_d VARCHAR(50), paperno_d VARCHAR(50),
    papercode_e VARCHAR(50), paperno_e VARCHAR(50),
    papercode_f VARCHAR(50), paperno_f VARCHAR(50),
    papercode_g VARCHAR(50), paperno_g VARCHAR(50),
    papercode_h VARCHAR(50), paperno_h VARCHAR(50),
    papercode_i VARCHAR(50), paperno_i VARCHAR(50),
    papercode_j VARCHAR(50), paperno_j VARCHAR(50),
    exampassed1 VARCHAR(100), board1 VARCHAR(100), year1 INT, roll_no1 VARCHAR(50), division1 VARCHAR(50), subject_taken1 TEXT,
    exampassed2 VARCHAR(100), board2 VARCHAR(100), year2 INT, roll_no2 VARCHAR(50), division2 VARCHAR(50), subject_taken2 TEXT,
    exampassed3 VARCHAR(100), board3 VARCHAR(100), year3 INT, roll_no3 VARCHAR(50), division3 VARCHAR(50), subject_taken3 TEXT,
    exampassed4 VARCHAR(100), board4 VARCHAR(100), year4 INT, roll_no4 VARCHAR(50), division4 VARCHAR(50), subject_taken4 TEXT,
    debarred_exam_name varchar(200),
    debarred_year INT,
    debarred_rollno VARCHAR(80),
    debarred_board VARCHAR(100)
);

// New students application_for

CREATE TABLE new_applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session VARCHAR(50),
    full_name VARCHAR(100),
    date_of_birth DATE,
    aadhaar_no VARCHAR(12) NOT NULL UNIQUE,
    sex VARCHAR(10),
    category VARCHAR(50),
    nationality VARCHAR(50),
    religion VARCHAR(50),
    name_of_community VARCHAR(50),
    contact_no VARCHAR(15),
    blood_group VARCHAR(5),
    email VARCHAR(100),
    fathers_name VARCHAR(100),
    fathers_occupation VARCHAR(100),
    mothers_name VARCHAR(100),
    mothers_occupation VARCHAR(100),
    permanent_address TEXT,
    present_address TEXT,
    guardian_name VARCHAR(100),
    guardian_address TEXT,
    hslc_board VARCHAR(50),
    hslc_rollno VARCHAR(20),
    hslc_year INTEGER,
    hslc_div VARCHAR(10),
    hslc_tmarks INTEGER,
    hslc_inst VARCHAR(100),
    classxii_board VARCHAR(50),
    classxii_rollno VARCHAR(20),
    classxii_year INTEGER,
    classxii_div VARCHAR(10),
    classxii_tmarks INTEGER,
    classxii_inst VARCHAR(100),
    course VARCHAR(100),
    mil VARCHAR(50),
    subject VARCHAR(100),
    user_id UUID,
    status VARCHAR(20) DEFAULT 'pending',
    pincode varchar(20),
    rejected_at TIMESTAMP   
);

ALTER TABLE new_applications
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON UPDATE CASCADE
ON DELETE SET NULL;


//file upload  table
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NULL,
    applicant_id UUID NULL,
    faculty_id UUID NULL,
    user_id UUID NULL,
    passport_path VARCHAR(255) NOT NULL,
    signature_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        student_id IS NOT NULL OR
        applicant_id IS NOT NULL OR
        faculty_id IS NOT NULL OR
        user_id IS NOT NULL
    ),
    CONSTRAINT file_uploads_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES student_details(student_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT file_uploads_applicant_id_fkey
        FOREIGN KEY (applicant_id) REFERENCES new_applications(application_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT file_uploads_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT unique_file_per_user UNIQUE (file_name)
);
CREATE TABLE faculty (
faculty_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                
name VARCHAR(150) NOT NULL,               
department VARCHAR(100),
designation varchar(255),
nature_of_apppointment varchar(200),           
role VARCHAR(100)NOT NULL DEFAULT 'staff',                                                                                
type varchar(100),
phone_number VARCHAR(20),
profile_picture TEXT,
);



CREATE TABLE department (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),           
    department_name VARCHAR(255) NOT NULL, 
    department_code VARCHAR(50) UNIQUE NOT NULL, 
    head_of_department UUID REFERENCES faculty(faculty_id) ON DELETE SET NULL, 
    number_of_faculty INT                                          
);



//PAYMENTS TABLE
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                        
    student_id UUID,
    application_id, 
    amount DECIMAL(10, 2) NOT NULL,            
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    payment_method VARCHAR(50),                
    payment_status VARCHAR(50) DEFAULT 'Pending', 
    transaction_id VARCHAR(255),               
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CHECK (
        (student_id IS NOT NULL AND application_id IS NULL) OR
        (application_id IS NOT NULL AND student_id IS NULL)
    )
);
ALTER TABLE payments
ADD CONSTRAINT fk_student_id, fk_application_id
FOREIGN KEY (student_id) REFERENCES student_details(student_id) ON DELETE SET NULL,
FOREIGN KEY (application_id) REFERENCES new_applications(application_id) ON DELETE SET NULL;

ALTER TABLE payments
ADD COLUMN notes TEXT;
ALTER TABLE payments
ADD COLUMN order_id VARCHAR(255) UNIQUE;

CREATE INDEX idx_student_id ON payments(student_id);
CREATE INDEX idx_application_id ON payments(application_id);
CREATE INDEX idx_transaction_id ON payments(transaction_id);
CREATE INDEX idx_fee_id ON payments(fee_id);


CREATE TABLE academic_records (
    record_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL,
    semester_id     UUID NOT NULL, 
    subject         VARCHAR(100) NOT NULL,
    grade           CHAR(1) NOT NULL,
    marks           NUMERIC(5, 2) NOT NULL,
    course          VARCHAR(200),
    exam_passed     VARCHAR(50),
    board           VARCHAR(25),
    year            INTEGER,
    division        VARCHAR(10),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

ALTER TABLE academic_records
ADD CONSTRAINT fk_student_id, fk_semester_id
FOREIGN KEY (student_id) REFERENCES students(student_id) ON UPDATE CASCADE ON DELETE CASCADE,
FOREIGN KEY (semester_id) REFERENCES semester(semester_id) ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE attendance (
    attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),         
    student_id UUID REFERENCES student_details(student_id) ON DELETE CASCADE ON UPDATE CASCADE,           
    date DATE NOT NULL,                        
    subject_code VARCHAR(50),                  
    status VARCHAR(150), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE library (
    borrow_id SERIAL PRIMARY KEY,              
    student_id VARCHAR(12) NOT NULL,            
    book_id VARCHAR(50) NOT NULL,               
    book_title VARCHAR(255) NOT NULL,           
    borrow_date DATE NOT NULL,                  
    return_date DATE,                           
    due_date DATE NOT NULL,                     
    fine DECIMAL(5, 2) DEFAULT 0.00,            
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 

);
ALTER TABLE library
ADD CONSTRAINT fk_student_id
FOREIGN KEY (student_id)
REFERENCES student_details(student_id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Table to store static semester values
CREATE TABLE semester (
    semester_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_name VARCHAR(50) NOT NULL UNIQUE
);

-- Table to store student semester results
CREATE TABLE semester_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    semester_id UUID NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade CHAR(1) NOT NULL,
    marks NUMERIC(5, 2) NOT NULL,
    remarks TEXT,
    FOREIGN KEY (semester_id) REFERENCES semester(semester_id) ON DELETE CASCADE
);


-- Example: Inserting data for a student with multiple subjects in the same semester
INSERT INTO semester_records (student_id, semester_id, subject, grade, marks, remarks)
VALUES
    ('uuid-of-student-1', 'uuid-of-1st-semester', 'Mathematics', 'A', 92.50, 'Excellent'),
    ('uuid-of-student-1', 'uuid-of-1st-semester', 'Physics', 'B', 85.00, 'Good');

SELECT 
    sr.student_id,
    s.semester_name,
    sr.subject,
    sr.grade,
    sr.marks,
    sr.remarks
FROM semester_records sr
JOIN semester s ON sr.semester_id = s.semester_id
WHERE sr.student_id = 'uuid-of-student-1'
  AND s.semester_name = '1st semester';



//trigger for moving students when graduated to alumini_records

CREATE OR REPLACE FUNCTION move_to_alumni_with_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the status has been updated to 'graduated'
    IF NEW.status = 'graduated' THEN
        -- Move student to alumni_records
        INSERT INTO alumni_records (
    session, full_name, date_of_birth, aadhaar_no, sex, category, nationality, religion,
    name_of_community, contact_no, blood_group, email, fathers_name, fathers_occupation,
    mothers_name, mothers_occupation, permanent_address, present_address, guardian_name,
    guardian_address
)
VALUES (
    OLD.session, OLD.full_name, OLD.date_of_birth, OLD.aadhaar_no, OLD.sex, OLD.category, 
    OLD.nationality, OLD.religion, OLD.name_of_community, OLD.contact_no, OLD.blood_group, 
    OLD.email, OLD.fathers_name, OLD.fathers_occupation, OLD.mothers_name, OLD.mothers_occupation,
    OLD.permanent_address, OLD.present_address, OLD.guardian_name, OLD.guardian_address
);
        -- Insert a log entry in graduation_logs
        INSERT INTO graduation_logs (
            student_id, full_name, program, graduated_by, graduation_date
        )
        VALUES (
            OLD.student_id, OLD.full_name, OLD.program, NEW.updated_by, NOW()
        );

        -- Optionally remove the student from student_details
        DELETE FROM student_details WHERE student_id = OLD.student_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Attach Trigger
CREATE TRIGGER trigger_move_to_alumni_with_log
AFTER UPDATE OF status
ON student_details
FOR EACH ROW
WHEN (NEW.status = 'graduated')
EXECUTE FUNCTION move_to_alumni_with_log();


// Graduation log
CREATE TABLE graduation_logs (
    log_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    program VARCHAR(100),
    graduated_by UUID NOT NULL,
    graduation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'moved_to_alumni',
    restored_at TIMESTAMP,
    restored_by UUID
);


// psql function to restore mistakenly moved to graduation back to not graduated
CREATE OR REPLACE FUNCTION restore_student_from_alumni()
RETURNS TRIGGER AS $$
DECLARE
    student_exists BOOLEAN;
BEGIN
    -- Check if student is already in student_details (avoid duplicates)
    SELECT EXISTS (SELECT 1 FROM student_details WHERE student_id = OLD.student_id) INTO student_exists;

    IF NOT student_exists THEN
        -- Restore student
        INSERT INTO student_details (student_id, full_name, aadhaar_no, program, admission_year, cgpa, status)
        SELECT OLD.student_id, OLD.full_name, OLD.aadhaar_no, OLD.program, OLD.admission_year, OLD.final_cgpa, 'active'
        FROM alumni_records
        WHERE student_id = OLD.student_id;

        -- Update log to show recovery
        UPDATE graduation_logs
        SET restored_at = NOW(), restored_by = NEW.updated_by
        WHERE student_id = OLD.student_id;
        
        -- Remove from alumni_records
        DELETE FROM alumni_records WHERE student_id = OLD.student_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


// trigger for restoring

CREATE TRIGGER trigger_restore_student
AFTER UPDATE OF status
ON graduation_logs
FOR EACH ROW
WHEN (NEW.status = 'restored')
EXECUTE FUNCTION restore_student_from_alumni();


//Prices

CREATE TABLE fee_pricing (
    id SERIAL PRIMARY KEY,
    payment_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR', 
    stream text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE faculty_academic_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL,
    number_of_journal_publications INT DEFAULT 0,
    number_of_books_published INT DEFAULT 0,
    number_of_books_edited INT DEFAULT 0,
    number_of_seminars_attended INT DEFAULT 0,
    number_of_papers_presented INT DEFAULT 0,
    committee_participation TEXT,
    academic_qualification TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE faculty_academic_records
ADD CONSTRAINT fk_faculty
FOREIGN KEY (faculty_id)
REFERENCES faculty (faculty_id)
ON DELETE CASCADE
ON UPDATE CASCADE;


ALTER TABLE faculty_academic_record
ADD CONSTRAINT fk_faculty
FOREIGN KEY (faculty_id)
REFERENCES faculty (faculty_id)
ON DELETE CASCADE
ON UPDATE CASCADE;


create table committee (
    committee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_name VARCHAR(200),
    role_in_committee VARCHAR(200),
    committee_type VARCHAR(200),
    committee_description TEXT,
    faculty_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE committee
ADD CONSTRAINT fk_faculty
FOREIGN KEY (faculty_id)
REFERENCES faculty (faculty_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE TYPE status_enum AS ENUM ('Pass', 'Fail');

CREATE TABLE exam_results (
    result_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    program VARCHAR(255) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    status status_enum NOT NULL
);

//CORS Configuration
const corsOptions = {
  origin: [process.env.FRONTEND_URL || "http://192.168.1.23:9000"||"http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions)); 

// Trigger to delete rejected applications older than 15 days

//3. Create a Scheduled Job to Delete Old Records
//Use pg_cron or an external scheduler to periodically delete records older than 15 days with the status "rejected".

//Install pg_cron (if not already available)
//Follow the installation guide for your PostgreSQL version and OS. Once installed, add the extension to your database:

CREATE EXTENSION pg_cron;
//Schedule the Cleanup Job
//Create a scheduled job to run daily and delete records older than 15 days.

SELECT cron.schedule(
  'delete_rejected_applications',  -- Job name
  '0 0 * * *',                    -- Schedule: daily at midnight
  $$ DELETE FROM student_details
     WHERE status = 'rejected'
       AND rejected_at < NOW() - INTERVAL '30 days'; $$
);

//Trigger to delete accepted applications older than 30 days

SELECT cron.schedule(
  'delete_accepted_applications',  -- Job name
  '0 0 * * *',                    -- Schedule: daily at midnight
  $$ DELETE FROM student_details
     WHERE status = 'accepted'
       AND rejected_at < NOW() - INTERVAL '30 days'; $$
);