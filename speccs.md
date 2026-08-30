Complete Specification - Project Overview and Tech Stack
Project Overview

Build a full-stack AI-powered College Information Assistant that uses Retrieval-Augmented Generation (RAG) to answer student questions using information retrieved from uploaded college documents.

The platform must allow administrators to upload college PDFs and other documents, process the documents into searchable chunks, generate embeddings, store them in a vector database, retrieve relevant information for student questions, and pass that retrieved context to an LLM to generate grounded answers.

The system must display the source document and page used for the answer, maintain conversation history, securely authenticate users, provide an administrator document-management interface, handle questions for which information is unavailable, and operate as a deployed web application.

The core RAG pipeline must be:

College Documents → Text Extraction → Cleaning → Chunking → Embeddings → Vector Database → Semantic Search → Relevant Context → LLM → Answer + Sources

Simply connecting a chatbot directly to an LLM does not satisfy this specification. A working retrieval pipeline with semantic search and vector storage is mandatory.

Tech Stack

The frontend uses React.js or Next.js, Tailwind CSS, JavaScript/TypeScript, Axios or Fetch API, and Zustand or Context API for client-side state management.

The backend uses Python, FastAPI, Pydantic, JWT authentication, and SQLAlchemy or an equivalent ORM.

The primary database uses PostgreSQL.

The vector database can use ChromaDB, Qdrant, or FAISS.

Document processing uses PyMuPDF for PDF extraction and python-docx for DOCX files. Tesseract OCR can be used for scanned documents.

Embedding generation uses Sentence Transformers or another configurable embedding provider.

LLM integration should use a provider abstraction supporting OpenAI, Google Gemini, OpenRouter, or a local LLM.

Docker should be used for containerization where appropriate, and Git/GitHub should be used for version control.

Sensitive credentials and API keys must be stored using environment variables or a secure secret-management system.

Core Features
Authentication

The authentication system must support user registration, login, JWT-based session handling, protected routes, a current-user profile endpoint, logout, role-based access control, password hashing, and persistent authentication state on the client.

The application must support at least two roles:

admin

student

Students must only be able to access their own conversations and permitted student features.

Administrators must have access to document-management and administrative functions.

College Knowledge Base

The knowledge-base system must allow administrators to upload college documents such as:

Admissions documents

Course information

Fee structures

Academic calendars

Examination notices

Hostel information

Library rules

Scholarship information

Placement documents

Department information

College policies

Event notices

FAQs

The system must validate uploaded files before processing.

Every uploaded document must have metadata such as:

document ID

filename

title

category

department

version

upload date

uploaded by

page count

processing status

document status

Document Processing

When an administrator uploads a document, the following pipeline must execute:

Document Upload

↓

File Validation

↓

Text Extraction

↓

Text Cleaning

↓

Metadata Preservation

↓

Chunking

↓

Embedding Generation

↓

Vector Database Storage

The system must maintain page numbers and document references wherever possible so that the original source can later be shown to the student.

The document-processing system must expose processing states such as:

PENDING

PROCESSING

COMPLETED

FAILED

If processing fails, the administrator must be able to see the failure and reprocess the document.

Text Extraction

The application must support text extraction from PDF, DOCX, and TXT files.

PDF files should be processed using a PDF parser such as PyMuPDF.

DOCX files should be processed using python-docx.

Scanned PDFs and image-based documents may optionally be processed using OCR.

The extracted content must be cleaned before chunking by removing unnecessary formatting, repeated whitespace, and extraction artifacts where appropriate.

Document Chunking

Large documents must not be sent directly to the LLM.

The extracted text must be divided into smaller chunks.

The chunking system must support configurable chunk size and overlap.

A reasonable initial configuration is:

Chunk size: approximately 500–800 tokens

Chunk overlap: approximately 50–150 tokens

Each chunk must preserve its original document ID and page number where available.

Each stored chunk should contain information such as:

chunk ID

document ID

chunk index

page number

chunk text

token count

metadata

vector ID

Embedding Generation

Each document chunk must be converted into a numerical embedding using a configurable embedding model.

The resulting vector must be stored in the vector database.

The system should maintain consistency between the embedding model used during document ingestion and the model used during query processing.

Vector Database

The application must use a vector database or vector-search index.

Supported implementations may include:

ChromaDB

Qdrant

FAISS

Pinecone

Weaviate

The vector database must support similarity search against stored document embeddings.

Each vector record must retain enough metadata to identify the original document and page.

Example information:

chunk ID

document ID

document title

page number

category

department

version

chunk text

embedding

Semantic Retrieval

When a student submits a question, the system must create an embedding for the query and perform semantic search against the vector database.

The retrieval flow must be:

Student Question

↓

Query Embedding

↓

Vector Search

↓

Top-K Relevant Chunks

↓

Optional Re-ranking

↓

Context Construction

↓

LLM

The number of retrieved chunks must be configurable.

The retriever should support metadata filtering based on category, department, active document status, and version.

RAG Generation

The LLM must receive:

System instructions

Student question

Retrieved context

Relevant conversation history

The system prompt must instruct the LLM to use the retrieved context as the authoritative source for college-specific information.

The LLM must not invent fees, dates, admission rules, examination schedules, contacts, or policies.

If the retrieved context does not contain enough information to answer the question, the system must clearly state that the information is unavailable in the current knowledge base.

Source / Reference Display

Every grounded answer should show the source used to generate the answer.

Example:

Answer:

The first-year hostel fee is ₹45,000 per academic year.

Source:

Hostel_Fee_Structure_2026.pdf

Page 3

The source system should maintain:

Document name

Page number

Document version

Relevant source excerpt

Optional relevance score

The frontend should display source information directly below or beside the answer.

Unknown Question Handling

The chatbot must safely handle questions for which relevant information is not available.

Example:

Student:

What will the college fee be in 2030?

Assistant:

I couldn't find information about the 2030 academic year in the available college documents.

The system must never guess when authoritative information cannot be retrieved.

Chat History

Students must be able to create and manage conversations.

The system must store:

Conversation ID

User ID

Conversation title

Messages

Message role

Timestamp

Model information

Response latency where available

The system must support follow-up questions.

Example:

Student:

What is the hostel fee?

Assistant:

The hostel fee is ₹45,000 per academic year.

Student:

What about mess charges?

The system should understand that the second question is related to the previously discussed hostel topic.

Conversation history must not override newly retrieved authoritative document information.

Admin Document Management

Administrators must be able to:

Upload documents

View documents

Search documents

Filter documents

Categorize documents

Assign departments

Update metadata

Create new document versions

Activate or deactivate documents

Reprocess documents

Delete documents

View processing status

Deleting a document must also remove or deactivate the corresponding vector records.

Complete Specification - Frontend Pages
/

The root page is the landing page for the platform.

It must include:

College AI assistant introduction

RAG explanation

Main features

Example student questions

Authentication-aware routing

Responsive design

Clear login/register buttons

/login

Provides the student/admin login interface with:

Email field

Password field

Validation

Loading states

Authentication errors

JWT/session handling

Redirect after successful login

/register

Provides account registration with:

Name

Email

Password

Confirm password

Validation

Duplicate-account handling

Authentication persistence

/chat

This is the primary student chatbot page.

It must provide:

Chat interface

Message history

Question input

Send button

Loading indicator

Suggested questions

Source cards

Document references

Unknown-answer handling

Error messages

Thumbs-up/thumbs-down feedback

Optional streaming responses

/history

Displays the student's previous conversations.

It must support:

Conversation listing

Conversation titles

Dates/timestamps

Search

Opening previous conversations

Deleting conversations

/profile

Provides:

User information

Account information

Role information

Logout

Security settings

/admin

The administrator dashboard must display:

Total documents

Processed documents

Failed documents

Pending documents

Total users

Total questions

Recent activity

Knowledge-base statistics

Optional retrieval and feedback analytics

/admin/documents

Provides complete document management.

Administrators must be able to:

Upload

Search

Filter

Categorize

View metadata

Reprocess

Update version

Activate/deactivate

Delete

View processing status

/admin/users

Allows administrators to view users and manage roles where appropriate.

/admin/analytics

Optional analytics dashboard containing:

Question count

Popular questions

Unanswered questions

Answer feedback

Retrieval statistics

Average response time

Document usage

Source usage

/settings

Provides:

Profile settings

Security settings

Notification preferences

Theme settings

Logout

Complete Specification - Backend Architecture and Database Collections
Backend Architecture

The routes layer handles HTTP endpoints and validation.

The authentication layer handles JWT validation and role authorization.

The controllers layer should only parse requests and return responses.

The services layer owns business logic such as:

User management

Document management

Document processing

Chat management

RAG execution

Feedback

Analytics

The RAG layer contains:

Document loaders

Text cleaners

Chunkers

Embedding providers

Retrievers

Optional re-rankers

Prompt builders

LLM generators

The vector layer provides a common interface for the selected vector database.

The storage layer manages uploaded document files.

The configuration layer manages environment variables and external providers.

The architecture must keep components modular and replaceable.

Database Collections / Tables
Users

Stores:

id

name

email

password hash

role

last login

created at

updated at

Documents

Stores:

id

filename

title

category

department

version

status

uploaded by

storage path

page count

processing status

created at

updated at

DocumentChunks

Stores:

id

document ID

chunk index

page number

chunk text

token count

vector ID

metadata

ChatSessions

Stores:

id

user ID

title

created at

updated at

Messages

Stores:

id

session ID

role

content

model

created at

latency

RetrievalLogs

Stores:

id

message ID

query

retrieved chunk IDs

retrieval scores

metadata filters

created at

Feedback

Stores:

id

message ID

user ID

rating

comment

created at

DocumentVersions

Stores:

id

document ID

version

status

created by

created at

Complete Specification - API Endpoints
Health and Authentication

GET /api/health

Provides backend health information, database status, vector database status, uptime, and service availability.

POST /api/auth/register

Creates a student account with validation and password hashing.

POST /api/auth/login

Authenticates the user and returns JWT/session information.

GET /api/auth/me

Returns the authenticated user's profile and role.

POST /api/auth/logout

Logs the user out.

Chat and RAG APIs

POST /api/chat

Accepts a student's question, performs retrieval, generates a grounded answer, stores the conversation, and returns the answer with sources.

GET /api/chat/sessions

Returns the authenticated user's conversation list.

GET /api/chat/sessions/:id

Returns a selected conversation and its messages.

DELETE /api/chat/sessions/:id

Deletes an owned conversation.

POST /api/chat/feedback

Stores user feedback for a chatbot answer.

GET /api/chat/suggestions

Returns suggested questions.

Document APIs

GET /api/documents

Returns accessible documents with filtering, search, and pagination.

POST /api/documents/upload

Uploads a document and starts document processing.

GET /api/documents/:id

Returns document metadata and processing status.

POST /api/documents/:id/reprocess

Re-extracts, re-chunks, embeds, and re-indexes a document.

PUT /api/documents/:id

Updates document metadata.

DELETE /api/documents/:id

Deletes or deactivates a document and associated vector records.

GET /api/documents/:id/source

Returns a permitted document preview/source.

Admin APIs

GET /api/admin/analytics

Returns system and chatbot analytics.

GET /api/admin/users

Returns users for administrators.

PUT /api/admin/users/:id/role

Updates a user's role.

Folder Structure
Frontend Structure

client/

src/

components/

AppShell/

ChatWindow/

MessageBubble/

SourceCard/

SuggestedQuestions/

DocumentUpload/

DocumentTable/

ProtectedRoute/

Loading/

pages/

login/

register/

chat/

history/

admin/

services/

store/

styles/

Backend Structure

server/

app/

api/

auth.py

chat.py

documents.py

admin.py

rag/

loaders.py

chunker.py

embeddings.py

retriever.py

reranker.py

prompts.py

generator.py

services/

auth_service.py

document_service.py

chat_service.py

storage_service.py

models/

schemas/

vector/

config/

main.py

Development Phases
Phase 1

Implement frontend and backend initialization.

Set up:

React/Next.js

FastAPI

PostgreSQL

Environment configuration

JWT authentication

Protected routes

Student/admin roles

Base UI

Phase 2

Implement document ingestion.

Build:

Document upload

File validation

PDF extraction

DOCX extraction

TXT processing

OCR support if required

Text cleaning

Page metadata

Chunking

Processing status

Phase 3

Implement the vector pipeline.

Build:

Embedding generation

Embedding configuration

Vector database integration

Vector storage

Semantic search

Top-K retrieval

Metadata filtering

Retrieval logging

Phase 4

Implement the complete RAG chatbot.

Build:

LLM provider abstraction

Prompt construction

Context injection

Grounded generation

Source references

Unknown-question handling

End-to-end question answering

Phase 5

Implement conversation management.

Build:

Chat sessions

Chat history

Follow-up questions

Conversation context

Suggested questions

Feedback

Phase 6

Implement the administrator platform.

Build:

Admin dashboard

Document list

Upload management

Document categories

Department filters

Version management

Reprocessing

Delete/deactivate

Processing status

Phase 7

Implement evaluation, security, performance optimization, and deployment.

Build:

Retrieval evaluation

Answer evaluation

Security hardening

API rate limiting

Error monitoring

Performance optimization

Docker deployment

Cloud deployment

Phase 8

Implement bonus features.

Possible additions:

OCR

Hybrid keyword + semantic search

Re-ranking

Multilingual support

Voice input

Voice output

Streaming responses

Analytics

Automatic FAQ generation

Conversation export

Advanced document version management

UI and UX Requirements

The interface must use a clean modern college-assistant design.

The UI must be:

Responsive

Accessible

Simple

Mobile-friendly

Easy to understand

The chat interface must clearly distinguish:

Student messages

AI responses

Sources

Errors

Loading states

The chatbot should show a source card underneath each grounded response.

The admin interface should use tables, filters, status badges, upload controls, and confirmation dialogs.

Document deletion must require confirmation.

The UI should provide meaningful loading indicators while documents are being processed or answers are being generated.

Security Requirements

The application must hash passwords using bcrypt or Argon2.

Passwords must never be stored in plaintext.

JWT secrets must be stored in environment variables.

API keys must never be committed to GitHub.

Admin APIs must be protected using role-based authorization.

Users must not be able to access other users' private conversations.

Uploaded files must be validated for type and size.

Authentication endpoints should use rate limiting.

Request bodies must be validated.

CORS should be restricted to the configured frontend origin.

Production deployment should use HTTPS.

Secrets, tokens, API keys, and passwords must never be written to application logs.

The system must prevent unauthorized document modification or deletion.

RAG Evaluation

The project must evaluate retrieval and generation separately.

Retrieval Evaluation

The system should measure:

Precision@K

Recall@K

Hit Rate

Mean Reciprocal Rank (MRR)

Context relevance

Generation Evaluation

The system should measure:

Faithfulness

Answer relevance

Citation accuracy

Context grounding

Unknown-question accuracy

Hallucination rate

Application Evaluation

The system should measure:

Response latency

Document processing time

Upload success rate

Authentication success rate

Retrieval success rate

API error rate

Mandatory Demonstration

The final demonstration must show the complete RAG pipeline.

Step 1:

Administrator uploads a college PDF.

Step 2:

The system extracts text.

Step 3:

The system preserves page metadata.

Step 4:

The system splits the document into chunks.

Step 5:

The chunks are converted into embeddings.

Step 6:

The embeddings are stored in the vector database.

Step 7:

A student asks a question.

Step 8:

The question is converted into an embedding.

Step 9:

Semantic search retrieves relevant chunks.

Step 10:

The retrieved chunks are passed to the LLM.

Step 11:

The LLM produces a grounded answer.

Step 12:

The application displays the source document and page.

Step 13:

An unknown question is tested.

Step 14:

The chatbot returns a safe unavailable-information response instead of guessing.

Test Cases

TC01 — Valid registration

Expected result: Student account is created.

TC02 — Invalid login

Expected result: Authentication is rejected.

TC03 — Admin uploads PDF

Expected result: Document enters processing.

TC04 — Successful document processing

Expected result: Text, chunks, metadata, and vector records are created.

TC05 — Known question

Expected result: Grounded answer and source are displayed.

TC06 — Unknown question

Expected result: Information-unavailable message is returned.

TC07 — Follow-up question

Expected result: Conversation context is maintained.

TC08 — Student attempts admin operation

Expected result: Access is denied.

TC09 — Document deletion

Expected result: Document and corresponding vectors are removed or deactivated.

TC10 — Invalid file upload

Expected result: Upload is rejected.

TC11 — Source inspection

Expected result: Correct document and page are shown.

TC12 — Retrieval/LLM service failure

Expected result: Clear error is returned and no fabricated answer is generated.

Bonus Features

Multiple document collections

Department-wise knowledge bases

Admin analytics

Document version management

Source highlighting

Confidence/relevance score

Multilingual chatbot

Voice input

Voice responses

Conversation export

Suggested questions

Answer feedback

Automatic document summarization

OCR

Hybrid keyword + semantic search

Document re-ranking

Role-based access

AI-generated FAQs

Streaming AI responses

Final Expected Outcome

The completed platform must allow administrators to upload and manage trusted college documents and allow authenticated students to ask natural-language questions about the college.

The application must retrieve relevant information from the knowledge base before generating answers.

Every grounded response should provide source information.

The system must safely handle questions for which relevant information is unavailable.

The platform must maintain conversation history, support administrator document management, persist application data, and operate as a deployed full-stack application.

The final application should function as a modern AI college information portal with a genuine RAG architecture rather than a simple LLM chatbot.

AI Coding Agent / Implementation Instructions

The AI coding agent must build the application phase by phase.

The folder structure must be followed consistently.

Controllers should remain thin and business logic should be implemented in services.

RAG components must remain modular.

The retrieval layer must never be bypassed for college-specific questions.

Every document chunk must preserve document and page metadata whenever possible.

Every answer should be traceable to retrieved chunks.

The LLM must not invent unavailable college information.

All secrets must be accessed through environment variables.

The .env file must never be committed to GitHub.

Document processing must be separate from chat generation.

The vector database must be accessed through a reusable abstraction.

The embedding provider must be configurable.

The LLM provider must be configurable.

Retrieval evidence should be stored for debugging and evaluation.

Errors from document processing, vector search, and LLM services must be explicit.

The implementation should prioritize:

RAG correctness

Source traceability

Security

Maintainability

Performance

Scalability

Deployment reliability

At the end of each development phase, the coding agent should report the files created or modified and the functionality completed.

Definition of Done

The project is considered complete when the following mandatory features are working:

Authentication

Student chat interface

Admin dashboard

Document upload

Document extraction

Text chunking

Embedding generation

Vector database

Semantic retrieval

LLM integration

Complete RAG pipeline

Source display

Unknown-question handling

Conversation history

Document update/versioning

Document deletion

Database persistence

Frontend-backend integration

Deployed application

