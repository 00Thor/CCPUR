BEGIN TRANSACTION;
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 1. USERS TABLE
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(300) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    program VARCHAR(150),
    password VARCHAR(250) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student'
);
-- 2. DEPARTMENT TABLE
CREATE TABLE department (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL,
    description TEXT
);

-- 3. SEMESTER TABLE
CREATE TABLE semester (
    semester_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester VARCHAR(50) NOT NULL UNIQUE
);

-- 4. STUDENT_DETAILS TABLE
CREATE TABLE student_details (
    student_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    session VARCHAR(50),
    full_name VARCHAR(100),
    date_of_birth DATE,
    aadhaar_no VARCHAR(14),
    gender VARCHAR(10),
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
    hslc_year VARCHAR,
    hslc_div VARCHAR(45),
    hslc_tmarks VARCHAR,
    hslc_inst VARCHAR(100),
    classxii_board VARCHAR(50),
    classxii_rollno VARCHAR(20),
    classxii_year VARCHAR,
    classxii_div VARCHAR(45),
    classxii_tmarks VARCHAR,
    classxii_inst VARCHAR(100),
    classxii_stream VARCHAR(200),
    course VARCHAR(100),
    mil VARCHAR(50),
    subject VARCHAR(100),
    abc_id VARCHAR(50),
    registration_no VARCHAR(100),
    course_code VARCHAR(50),
    roll_no VARCHAR(20) UNIQUE,
    user_id UUID,
    agree BOOLEAN,
    status VARCHAR(20) DEFAULT 'not-graduated',
    pincode VARCHAR(200),
    admission_date DATE CURRENT_DATE,
    current_semester VARCHAR(25) DEFAULT '1st Semester',
    PRIMARY KEY (student_id),
    CONSTRAINT student_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 5. NEW_APPLICATIONS TABLE
CREATE TABLE new_applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session VARCHAR(50),
    full_name VARCHAR(100),
    date_of_birth DATE,
    aadhaar_no VARCHAR(14) UNIQUE,
    gender VARCHAR(10),
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
    hslc_div VARCHAR(25),
    hslc_tmarks INTEGER,
    hslc_inst VARCHAR(100),
    classxii_board VARCHAR(50),
    classxii_rollno VARCHAR(20),
    classxii_year INTEGER,
    classxii_div VARCHAR(25),
    classxii_tmarks INTEGER,
    classxii_inst VARCHAR(100),
    classxii_stream VARCHAR(250),
    course VARCHAR(100),
    mil VARCHAR(50),
    subject VARCHAR(100),
    user_id UUID,
    status VARCHAR(20) DEFAULT 'pending',
    pincode VARCHAR(20),
    agree boolean DEFAULT false,
    rejected_at timestamp without time zone,
    accepted_at timestamp without time zone

);

ALTER TABLE new_applications
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- 6. FILE_UPLOADS TABLE
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID,
    application_id UUID,
    user_id UUID,
    passport TEXT UNIQUE,
    signature TEXT UNIQUE,
    xadmitcard TEXT UNIQUE,
    xiiadmitcard TEXT UNIQUE,
    xiiadmitcard TEXT UNIQUE,
    xmarksheet TEXT UNIQUE,
    xiimarksheet TEXT UNIQUE,
    migration TEXT UNIQUE,
    tribe TEXT UNIQUE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_file_per_user UNIQUE (passport),
    CONSTRAINT file_uploads_student_id_fkey FOREIGN KEY (student_id)
        REFERENCES student_details(student_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT file_uploads_applicant_id_fkey FOREIGN KEY (application_id)
        REFERENCES new_applications(application_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT file_uploads_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- 7. PAYMENTS TABLE
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                        
    student_id UUID,
    application_id UUID, 
    razorpay_order_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,            
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    payment_method VARCHAR(50),
    payment_type VARCHAR(200),                
    payment_status VARCHAR(50) DEFAULT 'pending', 
    transaction_id VARCHAR(255),
    notes TEXT,            
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CHECK (
        (student_id IS NOT NULL AND application_id IS NULL) OR
        (application_id IS NOT NULL AND student_id IS NULL)
    )
);

ALTER TABLE payments
ADD CONSTRAINT fk_student_id
FOREIGN KEY (student_id)
REFERENCES student_details(student_id)
ON DELETE SET NULL;

ALTER TABLE payments
ADD CONSTRAINT fk_application_id
FOREIGN KEY (application_id)
REFERENCES new_applications(application_id)
ON DELETE SET NULL;

-- 8. ATTENDANCE TABLE
CREATE TABLE attendance (
    attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_details(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    date DATE NOT NULL,
    subject_code VARCHAR(50),
    status VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. LIBRARY TABLE
CREATE TABLE library (
    book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    publisher VARCHAR(255),
    isbn VARCHAR(13),
    edition VARCHAR(50),
    category VARCHAR(100),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    added_date DATE DEFAULT CURRENT_DATE
);

-- 10. LIBRARY_RECORDS TABLE
CREATE TABLE library_records (
    borrow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID,
    book_id VARCHAR(50),
    book_title VARCHAR(255),
    borrow_date DATE,
    return_date DATE,
    due_date DATE,
    fine DECIMAL(5, 2) DEFAULT 0.00
);

ALTER TABLE library_records
ADD CONSTRAINT fk_student_id
FOREIGN KEY (student_id)
REFERENCES student_details(student_id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- 11. ACADEMIC_RECORDS TABLE
CREATE TABLE academic_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    semester_id UUID NOT NULL,
    course VARCHAR(200),
    exam_results VARCHAR(50),
    board VARCHAR(25),
    year INTEGER,
    division VARCHAR(10),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE academic_records
ADD CONSTRAINT fk_student_id FOREIGN KEY (student_id)
REFERENCES student_details(student_id)
ON UPDATE CASCADE
ON DELETE CASCADE;

ALTER TABLE academic_records
ADD CONSTRAINT fk_semester_id FOREIGN KEY (semester_id)
REFERENCES semester(semester_id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- 12. ACADEMIC_SUBJECTS TABLE
CREATE TABLE academic_subjects (
    subject_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES academic_records(record_id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade CHAR(10),
    marks NUMERIC(5, 2)
);

-- 13. DEFERRED_DELETIONS TABLE
CREATE TABLE deferred_deletions (
    student_id UUID PRIMARY KEY,
    deletion_date TIMESTAMP NOT NULL
);

-- 14. GRADUATION_LOGS TABLE
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

-- 15. FEE_PRICING TABLE
CREATE TABLE fee_pricing (
    id SERIAL PRIMARY KEY,
    payment_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    course TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. FACULTY TABLE
CREATE TABLE faculty (
    faculty_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    password VARCHAR(50),
    address TEXT,
    contact_number VARCHAR(15),
    date_of_birth DATE,
    gender TEXT,
    designation VARCHAR(255),
    type TEXT,
    joining_date DATE,
    teaching_experience VARCHAR(200),
    engagement VARCHAR(150),
    category VARCHAR(50),
    academic_qualifications VARCHAR(700),
    department_id INT REFERENCES department(department_id) ON DELETE SET NULL
);

-- 17. FACULTY_ACADEMIC_RECORDS TABLE
CREATE TABLE faculty_academic_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL,
    number_of_journal_published INT DEFAULT 0,
    number_of_books_published INT DEFAULT 0,
    number_of_books_edited INT DEFAULT 0,
    number_of_seminars_attended INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE faculty_academic_records
ADD CONSTRAINT fk_faculty
FOREIGN KEY (faculty_id)
REFERENCES faculty(faculty_id)
ON DELETE CASCADE    
ON UPDATE CASCADE;

-- 18. COMMITTEE TABLE
CREATE TABLE committee (
    committee_id SERIAL PRIMARY KEY,
    committee_name VARCHAR(200) NOT NULL,
    committee_type VARCHAR(200),
    committee_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. FACULTY_COMMITTEE_ROLES TABLE
CREATE TABLE faculty_committee_roles (
    role_id SERIAL PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES faculty(faculty_id) ON UPDATE CASCADE ON DELETE CASCADE,
    committee_id INT NOT NULL REFERENCES committee(committee_id) ON UPDATE CASCADE ON DELETE CASCADE,
    role_in_committee VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. FACULTY_FILES TABLE
CREATE TABLE faculty_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(faculty_id) ON DELETE CASCADE,
  file_type TEXT NOT NULL, -- e.g., 'profile_photos', 'books_published', 'seminars_attended'
  file_path TEXT NOT NULL, -- Path or URL to the uploaded file
  uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. EXAM_RESULTS TABLE
CREATE TYPE status_enum AS ENUM ('Pass', 'Fail');

CREATE TABLE exam_results (
    result_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    program VARCHAR(255) NOT NULL,
    subject TEXT,
    semester VARCHAR(50) NOT NULL,
    status status_enum NOT NULL
);

-- 22. DOCUMENTS TABLE
CREATE TABLE documents (
    doc_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    description TEXT,
    uploaded_at DATE DEFAULT CURRENT_DATE
);

--23 Student_examinations
CREATE TABLE semester_examinations (
    examination_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_details(student_id) ON DELETE CASCADE,
    application_for VARCHAR(100),
    examination_session VARCHAR(50),
    abc_id VARCHAR(50) UNIQUE,
    registration_no VARCHAR(100) UNIQUE,
    of_year VARCHAR(50),
    roll_no VARCHAR(50) UNIQUE,
    dept_code VARCHAR(50),
    course_code VARCHAR(50),
    year_semester VARCHAR(50),
    debarred_exam_name VARCHAR(200),
    debarred_year INT,
    debarred_rollno VARCHAR(80),
    debarred_board VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
--24.1 Student_exams papers
CREATE TABLE student_exam_papers (
    id SERIAL PRIMARY KEY,
    examination_id UUID REFERENCES semester_examinations(examination_id) ON DELETE CASCADE,
    paper_code VARCHAR(50),
    paper_no VARCHAR(50)
);

--25 Student education
CREATE TABLE student_education_history (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES student_details(student_id) ON DELETE CASCADE,
    exam_passed VARCHAR(100),
    board VARCHAR(100),
    year INT,
    roll_no VARCHAR(50),
    division VARCHAR(50),
    subjects_taken TEXT
);


-- 26. alumni_academic_records
CREATE TABLE alumni_records (
    alumni_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session VARCHAR(50),
    full_name VARCHAR(100),
    date_of_birth DATE,
    aadhaar_no VARCHAR(12),
    gender VARCHAR(10),
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
    permanent_address TEXT,
    present_address TEXT,
    guardian_name VARCHAR(100),
    guardian_address TEXT,
    archive_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT alumni_records_email_key UNIQUE (email)
    
);

-- 27. alumni records
CREATE TABLE alumni_academic_records (
    archive_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID NOT NULL,
    semester TEXT,
    subject VARCHAR(100) NOT NULL,
    grade CHAR(1) NOT NULL,
    marks NUMERIC(5,2) NOT NULL,
    archive_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    course VARCHAR(200),
    alumni_id UUID,
    CONSTRAINT fk_alumni_id FOREIGN KEY (alumni_id)
        REFERENCES alumni_records(alumni_id) ON DELETE CASCADE
);

-- 28
CREATE TABLE webpageFiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    uploaded_files JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--29
CREATE TABLE aadhaar_verification (
    verified_id SERIAL PRIMARY KEY,
    aadhaar_masked VARCHAR(14),
    aadhaar_hash TEXT,            
    status VARCHAR(50),
    message TEXT,
    care_of TEXT,                 
    address TEXT,                 
    dob TEXT,                     
    email TEXT,                   
    gender VARCHAR(10),
    name TEXT,                     
    country VARCHAR(100),
    dist TEXT,                     
    house TEXT,                    
    landmark TEXT,                 
    pincode INT,
    po TEXT,                       
    state VARCHAR(100),
    street TEXT,                   
    subdist TEXT,                   
    vtc TEXT,                       
    locality TEXT,                  
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 30. FUNCTIONS AND TRIGGERS
CREATE OR REPLACE FUNCTION move_to_alumni_with_log()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'graduated' THEN
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

        INSERT INTO graduation_logs (
            student_id, full_name, program, graduated_by, graduation_date
        )
        VALUES (
            OLD.student_id, OLD.full_name, OLD.program, NEW.updated_by, NOW()
        );

        INSERT INTO deferred_deletions (
            student_id, deletion_date
        )
        VALUES (
            OLD.student_id, NOW() + INTERVAL '20 days'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_move_to_alumni_with_log
AFTER UPDATE OF status
ON student_details
FOR EACH ROW
WHEN (NEW.status = 'graduated')
EXECUTE FUNCTION move_to_alumni_with_log();

--Restore student 
CREATE OR REPLACE FUNCTION restore_student_from_alumni()
RETURNS TRIGGER AS $$
DECLARE
    student_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM student_details WHERE student_id = OLD.student_id) INTO student_exists;
    IF NOT student_exists THEN
        INSERT INTO student_details (
            student_id, session, full_name, date_of_birth, aadhaar_no, sex, category, nationality,
            religion, name_of_community, contact_no, blood_group, email, fathers_name,
            fathers_occupation, mothers_name, mothers_occupation, permanent_address,
            present_address, guardian_name, guardian_address, status
        )
        SELECT
            student_id, session, full_name, date_of_birth, aadhaar_no, sex, category, nationality,
            religion, name_of_community, contact_no, blood_group, email, fathers_name,
            fathers_occupation, mothers_name, mothers_occupation, permanent_address,
            present_address, guardian_name, guardian_address, 'not-graduated'
        FROM alumni_records
        WHERE student_id = OLD.student_id;

        UPDATE graduation_logs
        SET restored_at = NOW(), restored_by = NEW.updated_by
        WHERE student_id = OLD.student_id;

        DELETE FROM alumni_records WHERE student_id = OLD.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_restore_student
AFTER UPDATE OF status
ON graduation_logs
FOR EACH ROW
WHEN (NEW.status = 'restored')
EXECUTE FUNCTION restore_student_from_alumni();

--Create a scheduled job to run daily and delete records older than 30 days.
SELECT cron.schedule(
    'delete_rejected_applications',
    '0 0 * * *',
    $$ DELETE FROM student_details
       WHERE status = 'rejected'
         AND rejected_at < NOW() - INTERVAL '30 days'; $$
);

SELECT cron.schedule(
    'delete_accepted_applications',
    '0 0 * * *',
    $$ DELETE FROM student_details
       WHERE status = 'accepted'
         AND rejected_at < NOW() - INTERVAL '30 days'; $$
);


COMMIT;