# CCPUR Backend Documentation

## Overview
This project is the backend for the CCPUR application, which handles user registration, authentication, file uploads, payment processing, faculty and admin operations, student applications, and academic records management.

## Table of Contents
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Routes](#routes)
- [Controllers](#controllers)
- [Middleware](#middleware)
- [Database](#database)

# Routes Overview

## Simple Operations
- **POST /register**: Register a new user.
- **POST /login**: User login.
- **POST /resetpassword**: Reset user password.
- **POST /forgotpassword**: Forgot password.
- **GET /getusers**: Get user details (requires authentication).

## File Uploads
- **POST /upload**: Upload files (passport and signature).
- **GET /getfiles/:user_id**: Get all uploaded files metadata by user ID (requires authentication).
- **GET /secure-getfiles/:user_id**: Securely retrieve a specific file by user ID and filename (requires authentication).

## Payments
- **POST /payments**: Create a new payment.
- **GET /payments/:id**: Get payment details by ID.
- **PATCH /payments/:id/status**: Update payment status.
- **GET /payments**: List all payments.
- **GET /verifypayment**: Verify payments.

## Faculty & Admin
- **GET /teaching-staff**: Get teaching staff details.
- **GET /non-teaching-staff**: Get non-teaching staff details (requires authentication).
- **PUT /updateAttendance**: Update attendance (requires authentication).
- **GET /getStudentDetails**: Fetch student details.
- **GET /getAllStudentDetails**: Fetch all student details.
- **PUT /updateStudentDetails**: Update student details (requires authentication).
- **DELETE /deleteStudentDetails**: Delete student details (requires authentication).
- **GET /getStaffDetails**: Fetch all/some faculty details.
- **GET /faculty-Dashboard**: Faculty dashboard (requires authentication).
- **PUT /updateStaffDetails**: Update staff details (requires authentication).
- **DELETE /deleteStaffDetails**: Delete staff details (requires authentication).

## Applications
- **POST /newapplication1**: Submit personal details for new application.
- **POST /newapplication2**: Submit educational details and files for new application.
- **GET /students/latest**: Get latest admitted students.
- **GET /getPendingApplications**: Get all pending applications.
- **GET /getSingleApplications**: Get single applicant applications (requires authentication).
- **PUT /approveApplicant**: Approve new student applications (requires authentication).
- **PUT /rejectApplication**: Reject new student applications (requires authentication).

## Alumni
- **POST /archiveStudent**: Move student from 6th semester to graduated.
- **POST /archiveStudent**: Undo mistakenly moved student from 6th semester to graduated.

## Academic
- **POST /semesterExamForm**: Submit semester examination form (requires authentication).
- **GET /getallAcademicRecords**: Get all academic records.
- **GET /getstudentAcademicRecord**: Get academic records by student.
- **POST /addRecord**: Add academic record.
- **PUT /updateAcademicRecords**: Update academic record.
- **DELETE /deleteAcademicRecords**: Delete academic record.

