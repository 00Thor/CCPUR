CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--1 Users table
CREATE TABLE users (
user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name VARCHAR(300) NOT NULL,
email VARCHAR(200) UNIQUE NOT NULL,
program varchar(150),
password varchar(250) NOT NULL,
role VARCHAR(50) NOT NULL DEFAULT 'student'
);

--2 department
CREATE TABLE department (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name VARCHAR(150) NOT NULL,
    description TEXT
);


--3 Table to store static semester values
CREATE TABLE semester (
    semester_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester VARCHAR(50) NOT NULL UNIQUE
);

--4 table for student_details
CREATE TABLE student_details (
    student_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    session character varying(50),
    full_name character varying(100),
    date_of_birth date,
    aadhaar_no character varying(14),
    gender character varying(10),
    category character varying(50),
    nationality character varying(50),
    religion character varying(50),
    name_of_community character varying(50),
    contact_no character varying(15),
    blood_group character varying(5),
    email character varying(100) UNIQUE,
    fathers_name character varying(100),
    fathers_occupation character varying(100),
    mothers_name character varying(100),
    mothers_occupation character varying(100),
    permanent_address text,
    present_address text,
    guardian_name character varying(100),
    guardian_address text,
    hslc_board character varying(50),
    hslc_rollno character varying(20),
    hslc_year character varying,
    hslc_div character varying(45),
    hslc_tmarks character varying,
    hslc_inst character varying(100),
    classxii_board character varying(50),
    classxii_rollno character varying(20),
    classxii_year character varying,
    classxii_div character varying(45),
    classxii_tmarks character varying,  
    classxii_inst character varying(100),
    classxii_stream character varying(200),
    course character varying(100),
    mil character varying(50),
    subject character varying(100),
    abc_id character varying(50),
    registration_no character varying(100),
    course_code character varying(50),
    roll_no character varying(20) UNIQUE,
    user_id uuid,
    agree boolean,
    status character varying(20) DEFAULT 'not-graduated',
    pincode character varying(200),
    admission_date date,
    current_semester character varying(25) DEFAULT '1st Semester',
    PRIMARY KEY (student_id),
    CONSTRAINT student_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

--5 New students application
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
    hslc_div VARCHAR(20),
    hslc_tmarks INTEGER,
    hslc_inst VARCHAR(100),
    classxii_board VARCHAR(50),
    classxii_rollno VARCHAR(20),
    classxii_year INTEGER,
    classxii_div VARCHAR(10),
    classxii_tmarks INTEGER,
    classxii_inst VARCHAR(100),
    classxii_stream VARCHAR(250),
    course VARCHAR(100),
    mil VARCHAR(50),
    subject VARCHAR(100),
    user_id UUID,
    agree boolean DEFAULT 'f'
    status VARCHAR(20) DEFAULT 'pending',
    pincode varchar(20),
    rejected_at timestamp without time zone,
    accepted_at timestamp without time zone  
);

ALTER TABLE new_applications
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON UPDATE CASCADE
ON DELETE SET NULL;

--6 file upload  table
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

--7 PAYMENTS TABLE
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

--8 attandance
CREATE TABLE attendance (
    attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),         
    student_id UUID REFERENCES student_details(student_id) ON DELETE CASCADE ON UPDATE CASCADE,           
    date DATE NOT NULL,                        
    subject_code VARCHAR(50),                  
    status VARCHAR(150), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9 library
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

--10 Library_records
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


-- Step 11: Create the `academic_records` table
CREATE TABLE academic_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    semester_id UUID NOT NULL,
    semester_id TEXT,
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


-- 12 Create the `academic_subjects` table
CREATE TABLE academic_subjects (
    subject_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES academic_records(record_id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade CHAR(10),
    marks NUMERIC(5,2)
);

--13 deferred deletion
CREATE TABLE deferred_deletions (
    student_id UUID PRIMARY KEY,
    deletion_date TIMESTAMP NOT NULL
);

--14 Graduation log
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


--15 Prices table
CREATE TABLE fee_pricing (
    id SERIAL PRIMARY KEY,
    payment_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR', 
    course text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--16 Faculty table
CREATE TABLE faculty (
faculty_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                
name VARCHAR(150) NOT NULL,
email varchar(150),
address text,
contact_number varchar(15),
date_of_birth date,
gender text,              
department VARCHAR(100),
designation varchar(255),
type TEXT,
joining_date date,
teaching_experience varchar(200),
engagement varchar(150),
category varchar(50),
academic_qualifications varchar(700),
department_id UUID REFERENCES department(department_id) ON DELETE SET NULL
);


--17 Faculty academic records
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
REFERENCES faculty (faculty_id)
ON DELETE CASCADE
ON UPDATE CASCADE;

--18 Committee
CREATE TABLE committee (
    committee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_name VARCHAR(200) NOT NULL,
    committee_type VARCHAR(200),
    committee_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


--19 Faculty committee Roles
CREATE TABLE faculty_committee_roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculty(faculty_id) ON DELETE CASCADE,
    committee_id UUID NOT NULL REFERENCES committee(committee_id) ON DELETE CASCADE,
    role_in_committee VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
 --20 Faculty files storing as an array
CREATE TABLE faculty_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(faculty_id) ON DELETE CASCADE,
  file_type TEXT NOT NULL, -- e.g., 'profile_photos', 'books_published', 'seminars_attended'
  file_path TEXT NOT NULL, -- Path or URL to the uploaded file
  uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


--21 exams results
CREATE TYPE status_enum AS ENUM ('Pass', 'Fail');

CREATE TABLE exam_results (
    result_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    program VARCHAR(255) NOT NULL,
    subject TEXT,
    semester VARCHAR(50) NOT NULL,
    status status_enum NOT NULL
);

--22 documents
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

--24 Student_exams papers
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
- 26. alumni_academic_records
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
        REFERENCES alumni_academic_records(alumni_id) ON DELETE CASCADE
);


--28 Triggers and Functions
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

        -- Schedule deletion of student record after 20 days
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

-- Attach Trigger
CREATE TRIGGER trigger_move_to_alumni_with_log
AFTER UPDATE OF status
ON student_details
FOR EACH ROW
WHEN (NEW.status = 'graduated')
EXECUTE FUNCTION move_to_alumni_with_log();

--Restore Student
CREATE OR REPLACE FUNCTION restore_student_from_alumni()
RETURNS TRIGGER AS $$
DECLARE
    student_exists BOOLEAN;
BEGIN
    -- Check if student is already in student_details (avoid duplicates)
    SELECT EXISTS (SELECT 1 FROM student_details WHERE student_id = OLD.student_id) INTO student_exists;

    IF NOT student_exists THEN
        -- Restore student
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
            present_address, guardian_name, guardian_address, 'active'
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

-- trigger for restoring

CREATE TRIGGER trigger_restore_student
AFTER UPDATE OF status
ON graduation_logs
FOR EACH ROW
WHEN (NEW.status = 'restored')
EXECUTE FUNCTION restore_student_from_alumni();


--Background Job for Deletion
--We can use pg_cron or a similar job scheduler, the following query can be used to delete records after 20 days

DELETE FROM student_details
WHERE student_id IN (
    SELECT student_id FROM deferred_deletions
    WHERE deletion_date <= NOW()
);
-- Clean up the deferred_deletions table
DELETE FROM deferred_deletions
WHERE deletion_date <= NOW();


--29 
-- Trigger to delete rejected applications older than 30 days

-- Create a Scheduled Job to Delete Old Records
-- Use pg_cron or an external scheduler to periodically delete records older than 15 days with the status "rejected".

--Install pg_cron (if not already available)
--Follow the installation guide for your PostgreSQL version and OS. Once installed, add the extension to your database:

CREATE EXTENSION IF NOT EXIST pg_cron;
--Schedule the Cleanup Job
--Create a scheduled job to run daily and delete records older than 30 days.

SELECT cron.schedule(
  'delete_rejected_applications',  -- Job name
  '0 0 * * *',                    -- Schedule: daily at midnight
  $$ DELETE FROM student_details
     WHERE status = 'rejected'
       AND rejected_at < NOW() - INTERVAL '30 days'; $$
);

--Trigger to delete accepted applications older than 30 days

SELECT cron.schedule(
  'delete_accepted_applications',  -- Job name
  '0 0 * * *',                    -- Schedule: daily at midnight
  $$ DELETE FROM student_details
     WHERE status = 'accepted'
       AND rejected_at < NOW() - INTERVAL '30 days'; $$
);

CREATE TABLE webpageFiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    uploaded_files JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
