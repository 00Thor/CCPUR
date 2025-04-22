--1. departments

INSERT INTO department (department_name) VALUES
('Anthropology'),
('Botany'),
('Chemistry'),
('Geography'),
('Mathematics'),
('Physics'),
('Statistics'),
('Zoology'),
('Economics'),
('Education'),
('English'),
('History'),
('Manipuri'),
('Mizo'),
('Political Science'),
('Sociology');

INSERT INTO committee (committee_name, committee_type, committee_description)
VALUES
('Admission', 'Academic', 'Handles admission-related processes and policies'),
('Anti-Ragging', 'Disciplinary', 'Ensures a ragging-free environment'),
('Botanical Garden Management', 'Environmental', 'Oversees maintenance and development of the botanical garden'),
('Building Construction', 'Infrastructure', 'Manages construction and infrastructure projects'),
('Code of Conduct', 'Disciplinary', 'Defines and enforces behavioral guidelines'),
('Compliance', 'Regulatory', 'Ensures compliance with academic and legal regulations'),
('Cultural', 'Extracurricular', 'Organizes cultural events and activities'),
('Development', 'Administrative', 'Focuses on institutional development initiatives'),
('Environment Protection', 'Environmental', 'Promotes eco-friendly practices and sustainability'),
('Examination', 'Academic', 'Manages exams and assessment policies'),
('Games & Sports', 'Extracurricular', 'Organizes sports and games activities'),
('Library', 'Academic', 'Oversees library management and resources'),
('Planning & Development', 'Administrative', 'Strategic planning and development of the institution'),
('Research', 'Academic', 'Promotes and facilitates faculty and student research'),
('Sexual Harassment', 'Disciplinary', 'Addresses and prevents sexual harassment issues'),
('Student Welfare', 'Student Affairs', 'Supports student well-being and services'),
('Website Policies', 'IT', 'Maintains website guidelines and content policies'),
('Welfare', 'Administrative', 'General welfare of faculty and staff'),
('Academic Council', 'Academic', 'Responsible for academic policies and standards'),
('Botanical Club', 'Environmental', 'Promotes botanical studies and activities'),
('Ek Bharat Shreshtha Bharat Club', 'Cultural', 'Promotes unity in diversity through cultural exchange programs'),
('Film/Dram Club', 'Extracurricular', 'Organizes film screenings and drama productions'),
('Grievance Redressal Cell', 'Administrative', 'Handles student and staff grievances'),
('Guidance Cell', 'Student Affairs', 'Provides academic and career guidance'),
('Health Club', 'Health & Wellness', 'Promotes health and wellness activities'),
('Hobby Club', 'Extracurricular', 'Encourages students to pursue hobbies and interests'),
('Internal Quality Assurance Club (IQAC)', 'Administrative', 'Ensures quality standards in academics and administration'),
('Literary Club', 'Extracurricular', 'Encourages literary activities and events'),
('Minority Club', 'Student Affairs', 'Supports minority communities within the institution'),
('Photography Club', 'Extracurricular', 'Focuses on photography skills and activities'),
('SC/ST/OBC Cell', 'Regulatory', 'Supports SC/ST/OBC students and addresses their concerns'),
('Teachers Council', 'Academic', 'Forum for teachers to discuss academic matters'),
('Academic Bank of Credits', 'Academic', 'Manages credit accumulation and transfer for students'),
('Electoral Literacy Club', 'Civic Engagement', 'Promotes electoral awareness and participation'),
('Rashtriya Uchchatar Shiksha Abhiyan (RUSA)', 'Administrative', 'Monitors RUSA implementation in the institution'),
('National Cadet Corps', 'Student Affairs', 'Provides military training and promotes discipline among students'),
('International Red Cross Society (IRCS) Youth Wing', 'Health & Wellness', 'Organizes health and humanitarian activities'),
('National Service Scheme (NSS)', 'Student Affairs', 'Encourages social service and community development initiatives'),
('Entrepreneurship Development Committee', 'Entreprenuership', 'Promotes entrepreneurship and innovation among'),
('Dance Society', 'Dancing', 'Promotes dance'),
('Music Society', 'Music', 'Promotes music'),
('Arts and Craft Society', 'Arts and Craft', 'Promotes arts and craft');


SELECT 
  f.*,

  d.department_id,
  d.department_name,
  d.description AS department_description,

  ar.record_id,
  ar.number_of_journal_published,
  ar.number_of_books_published,
  ar.number_of_books_edited,
  ar.number_of_seminars_attended,
  ar.created_at AS academic_created_at,

  fcr.role_id,
  fcr.role_in_committee,
  fcr.created_at AS role_created_at,

  c.committee_id,
  c.committee_name,
  c.committee_type,
  c.committee_description

FROM faculty f
LEFT JOIN department d ON f.department_id = d.department_id
LEFT JOIN faculty_academic_records ar ON f.faculty_id = ar.faculty_id
LEFT JOIN faculty_committee_roles fcr ON f.faculty_id = fcr.faculty_id
LEFT JOIN committee c ON fcr.committee_id = c.committee_id

-- Optional: get a single faculty
 WHERE f.faculty_id = '175c0d8d-35d2-4aba-875e-fa69f94d51a6'


 Chairperson,Vice Chairperson,Convenor,Coordinator,Assistant Coordinator,IT Nodal Officer, Core Member,Secretary,Member Secretary, Member

 delete from faculty;

 SELECT * FROM department;