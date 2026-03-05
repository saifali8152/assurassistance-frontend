# Route Protection Test Scenarios

## Test Cases for Authentication and Route Protection

### 1. Unauthenticated User Scenarios

#### Test Case 1.1: Access Login Page
- **URL**: `/login`
- **Expected**: Show login page
- **Status**: ✅ Should work

#### Test Case 1.2: Access Forgot Password Page
- **URL**: `/forgot-password`
- **Expected**: Show forgot password page
- **Status**: ✅ Should work

#### Test Case 1.3: Access Change Password Page
- **URL**: `/change-password`
- **Expected**: Redirect to `/login`
- **Status**: ✅ Should redirect (requires authentication)

#### Test Case 1.4: Access Admin Dashboard
- **URL**: `/admin`
- **Expected**: Redirect to `/login`
- **Status**: ✅ Should redirect (requires authentication)

#### Test Case 1.5: Access User Dashboard
- **URL**: `/user`
- **Expected**: Redirect to `/login`
- **Status**: ✅ Should redirect (requires authentication)

### 2. Authenticated User (No Password Change Required) Scenarios

#### Test Case 2.1: Admin User Access Login Page
- **User**: Admin (force_password_change: false)
- **URL**: `/login`
- **Expected**: Redirect to `/admin`
- **Status**: ✅ Should redirect to dashboard

#### Test Case 2.2: Admin User Access Forgot Password
- **User**: Admin (force_password_change: false)
- **URL**: `/forgot-password`
- **Expected**: Redirect to `/admin`
- **Status**: ✅ Should redirect to dashboard

#### Test Case 2.3: Admin User Access Change Password
- **User**: Admin (force_password_change: false)
- **URL**: `/change-password`
- **Expected**: Redirect to `/admin`
- **Status**: ✅ Should redirect to dashboard

#### Test Case 2.4: Agent User Access Login Page
- **User**: Agent (force_password_change: false)
- **URL**: `/login`
- **Expected**: Redirect to `/user`
- **Status**: ✅ Should redirect to dashboard

#### Test Case 2.5: Agent User Access Admin Dashboard
- **User**: Agent (force_password_change: false)
- **URL**: `/admin`
- **Expected**: Redirect to `/unauthorized`
- **Status**: ✅ Should show unauthorized

### 3. Authenticated User (Password Change Required) Scenarios

#### Test Case 3.1: User with Password Change Required Access Login
- **User**: Any role (force_password_change: true)
- **URL**: `/login`
- **Expected**: Redirect to `/change-password`
- **Status**: ✅ Should redirect to change password

#### Test Case 3.2: User with Password Change Required Access Forgot Password
- **User**: Any role (force_password_change: true)
- **URL**: `/forgot-password`
- **Expected**: Redirect to `/change-password`
- **Status**: ✅ Should redirect to change password

#### Test Case 3.3: User with Password Change Required Access Admin Dashboard
- **User**: Admin (force_password_change: true)
- **URL**: `/admin`
- **Expected**: Redirect to `/change-password`
- **Status**: ✅ Should redirect to change password

#### Test Case 3.4: User with Password Change Required Access User Dashboard
- **User**: Agent (force_password_change: true)
- **URL**: `/user`
- **Expected**: Redirect to `/change-password`
- **Status**: ✅ Should redirect to change password

#### Test Case 3.5: User with Password Change Required Access Change Password
- **User**: Any role (force_password_change: true)
- **URL**: `/change-password`
- **Expected**: Show change password page
- **Status**: ✅ Should work

### 4. Role-Based Access Scenarios

#### Test Case 4.1: Admin Access Admin Routes
- **User**: Admin
- **URL**: `/admin/*`
- **Expected**: Allow access
- **Status**: ✅ Should work

#### Test Case 4.2: Agent Access Admin Routes
- **User**: Agent
- **URL**: `/admin/*`
- **Expected**: Redirect to `/unauthorized`
- **Status**: ✅ Should show unauthorized

#### Test Case 4.3: Agent Access User Routes
- **User**: Agent
- **URL**: `/user/*`
- **Expected**: Allow access
- **Status**: ✅ Should work

#### Test Case 4.4: Admin Access User Routes
- **User**: Admin
- **URL**: `/user/*`
- **Expected**: Redirect to `/unauthorized`
- **Status**: ✅ Should show unauthorized

## Implementation Details

### AuthGuard Component Props:
- `requireAuth`: boolean - Whether authentication is required
- `requirePasswordChange`: boolean - Whether user must need password change
- `allowedRoles`: array - Which roles are allowed to access
- `redirectTo`: string - Custom redirect path

### Route Configurations:
- **Public Routes** (`/login`, `/forgot-password`): `requireAuth={false}`
- **Change Password Route** (`/change-password`): `requireAuth={true} requirePasswordChange={true}`
- **Admin Routes** (`/admin/*`): `requireAuth={true} allowedRoles={['admin']}`
- **User Routes** (`/user/*`): `requireAuth={true} allowedRoles={['agent']}`

## Testing Instructions:

1. **Clear browser storage**: `localStorage.clear()`
2. **Test each scenario** by navigating to the URLs
3. **Check console logs** for redirect decisions
4. **Verify AuthDebug panel** shows correct auth state
5. **Test with different user roles** and password change requirements

## Expected Behavior Summary:

✅ **Unauthenticated users**: Can only access login and forgot-password pages
✅ **Authenticated users without password change**: Redirected away from public pages to their dashboard
✅ **Authenticated users with password change**: Always redirected to change-password page
✅ **Role-based access**: Users can only access routes for their role
✅ **Password change enforcement**: Users with `force_password_change: true` cannot access any dashboard until password is changed
