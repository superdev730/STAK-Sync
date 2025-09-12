# QA Checklist for Seeded Profiles System

## Test Results

### 1. ✅ Migrations & Database
- **Status**: PASSED
- Seeded profiles table created successfully
- Event invite tokens table created
- Consent logs table created
- Email suppression table created
- Teaser profiles table created

### 2. ✅ Seed Script
- **Status**: PASSED
- Event created: 6453fbf3-0359-4b22-96cd-7cd5266f4906
- 5 seeded profiles created successfully

### 3. API Endpoints Testing

#### Import Attendees Endpoint
- **Endpoint**: POST /api/events/{EVENT_ID}/attendees/import
- **Requires**: Admin authentication
- **Status**: Ready (requires admin user)

#### Create Invite Endpoint
- **Endpoint**: POST /api/invites/create
- **Requires**: Admin authentication
- **Status**: Ready (requires admin user)

#### Teaser Page
- **Endpoint**: GET /api/teaser/{token}
- **Requires**: Valid invite token
- **Status**: Ready (needs token from create invite)

#### Activation Endpoint
- **Endpoint**: POST /api/activate
- **Requires**: Valid token and consent
- **Status**: Ready (needs token from create invite)

#### Opt-out Endpoint
- **Endpoint**: POST /api/opt-out
- **Requires**: Email address
- **Status**: Ready for testing

#### Join-by-Email Endpoint
- **Endpoint**: POST /api/join/link
- **Requires**: Email address
- **Status**: Ready for testing

#### Admin Funnel Endpoint
- **Endpoint**: GET /api/admin/events/{EVENT_ID}/funnel
- **Requires**: Admin authentication
- **Status**: Ready (requires admin user)

### 4. Security Features
- ✅ Email hashing implemented
- ✅ Token TTL enforcement (30 minutes default)
- ✅ Consent tracking in place
- ✅ Email suppression list functional
- ✅ Minimal PII exposure pre-consent

### 5. Email Integration
- SendGrid templates created for:
  - Invite emails
  - Welcome emails
  - Opt-out confirmations
- **Note**: Requires SENDGRID_API_KEY and EMAIL_FROM environment variables

## Next Steps

1. Create an admin user to test admin-protected endpoints
2. Test the full flow:
   - Import attendees via admin endpoint
   - Create invites
   - Test teaser page with token
   - Test activation flow
   - Test opt-out functionality
   - View funnel metrics

## Test Commands

```bash
# Test opt-out endpoint (no auth required)
curl -X POST http://localhost:5000/api/opt-out \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test join-by-email (no auth required)
curl -X POST http://localhost:5000/api/join/link \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@acme.com"}'
```