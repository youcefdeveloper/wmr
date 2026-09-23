import React, { useEffect, useState } from 'react'
import type { Filter } from '@admin-types/adminTypes.ts'
import Pagination from '@components/admin/react/Pagination'
import CurrentFilter from '@components/admin/react/users/CurrentFilter'
import { client } from '@config/client'
import { formatDateTime, parseQueryParams, updateQueryParams } from '@utils/common.ts'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAdminThemeStore } from '@stores/admin/theme.store'
import { useUserStore } from '@stores/user_storage'
import { DEFAULT_AVATAR } from '@utils/constants'

interface User {
  id: string
  email: string
  name: string
  role: 'superadmin' | 'admin' | 'user'
  providers: ('google' | 'github' | 'linkedin' | 'microsoft' | 'apple')[]
  image?: string
  createdAt: string
  isActive: boolean
}

type UserManagementProps = {
  filter: Filter
  email: string | null | undefined
  image: string | null | undefined
  provider: 'google' | 'github' | 'linkedin' | 'microsoft' | 'apple' | null | undefined
}

const UserManagement = ({ filter, email, image, provider }: UserManagementProps) => {
  const [roles, setRoles] = useState<{ name: string; value: string }[]>([])
  const [providers, setProviders] = useState<{ name: string; value: string }[]>([])

  // Get current user role from Zustand
  const userRole = useUserStore(state => state.user?.role)

  // UI rules
  const isUser = userRole === 'user'
  const isAdmin = userRole === 'admin'
  const isSuperadmin = userRole === 'superadmin'

  // Helper for the New Account modal role
  let addUserDefaultRole: 'superadmin' | 'admin' | 'user' = 'user'
  let addUserRoleReadOnly = false
  if (isAdmin) {
    addUserDefaultRole = 'admin'
    addUserRoleReadOnly = true
  } else if (isSuperadmin) {
    addUserDefaultRole = 'superadmin'
    addUserRoleReadOnly = true
  }

  useEffect(() => {
    async function fetchInitializer() {
      try {
        const res = await client.get('/api/v1/auth/initializer')
        setRoles(res.data.roles || [])
        setProviders(res.data.providers || [])
      } catch (err) {
        // fallback: do nothing, keep empty
      }
    }
    fetchInitializer()
  }, [])
  const [meta, setMeta] = useState({
    fromPage: 0,
    toPage: 0,
    page: filter.page || 1,
    itemsPerPage: filter.size || 10,
    totalPages: 0,
    totalItems: 0,
  })
  
    // Handler for confirming Superadmin assignment
    const confirmAssignSuperAdmin = async () => {
      if (!assignSuperAdminUserId) return;
      try {
        await handleTransferSuperadmin(assignSuperAdminUserId);
      } catch (error) {
        toast.error('Failed to assign Superadmin.', { theme });
      }
      setShowAssignSuperAdminModal(false);
      setAssignSuperAdminUserId(null);
    };

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [currentFilter, setCurrentFilter] = useState(filter)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'user' as 'superadmin' | 'admin' | 'user',
    providers: [] as ('google' | 'github' | 'linkedin' | 'microsoft' | 'apple')[],
  })

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [assignSuperAdminUserId, setAssignSuperAdminUserId] = useState<string | null>(null)
  const [showAssignSuperAdminModal, setShowAssignSuperAdminModal] = useState(false)
  const theme = useAdminThemeStore(state => state.theme)

  useEffect(() => {
    fetchUsers()
    const handlePopState = () => fetchUsers()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const query = window.location.search
      const response = await client.get(`/api/v1/auth/users${query}`)

      if (response.status === 200 && response.data) {
        const { data, ...metaData } = response.data
        setUsers(data || [])
        
        // Map API response to meta state
        setMeta({
          fromPage: metaData.from || 0,
          toPage: metaData.to || 0,
          page: metaData.page || 1,
          itemsPerPage: metaData.size || 10,
          totalPages: metaData.pages || 0,
          totalItems: metaData.total || 0,
        })
        setCurrentFilter(parseQueryParams(query))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (newUser.email && newUser.name && newUser.providers.length > 0) {
      try {
        await client.post('/api/v1/auth/users', {
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          providers: newUser.providers,
          isActive: true,
        })

        await fetchUsers()
        setNewUser({ email: '', name: '', role: 'user', providers: [] })
        setShowAddModal(false)
      } catch (error) {
        console.error('Error creating user:', error)
        toast.error('Failed to create user')
      }
    }
  }

  const handleProviderToggle = (provider: 'google' | 'github' | 'linkedin' | 'microsoft' | 'apple', isNewUser: boolean = true) => {
    if (isNewUser) {
      setNewUser(prev => ({
        ...prev,
        providers: prev.providers.includes(provider)
          ? prev.providers.filter(p => p !== provider)
          : [...prev.providers, provider],
      }))
    } else if (editingUser) {
      setEditingUser(prev => prev ? ({
        ...prev,
        providers: prev.providers.includes(provider)
          ? prev.providers.filter(p => p !== provider)
          : [...prev.providers, provider],
      }) : null)
    }
  }

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateQueryParams({ size: e.target.value, page: '' })
    }

  const handleEditUser = async () => {
    if (editingUser && editingUser.providers.length > 0) {
      try {
        await client.put(`/api/v1/auth/users/${editingUser.id}`, {
          email: editingUser.email,
          name: editingUser.name,
          role: editingUser.role,
          providers: editingUser.providers,
          isActive: editingUser.isActive,
        })

        await fetchUsers()
        setEditingUser(null)
        setShowEditModal(false)
      } catch (error:any) {
        console.error('Error updating user:', error)
        toast.error(error.response.data.error || 'Failed to update user')
      }
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'superadmin' | 'admin' | 'user') => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      await client.put(`/api/v1/auth/users/${userId}`, {
        ...user,
        role: newRole,
      })

      await fetchUsers()
    } catch (error:any) {
      console.error('Error updating user role:', error)
      toast.error(error.response.data.error || 'Failed to update user role')
    }
  }

  const handleToggleActive = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      await client.put(`/api/v1/auth/users/${userId}`, {
        ...user,
        isActive: !user.isActive,
      })

      await fetchUsers()
    } catch (error:any) {
      console.error('Error toggling user status:', error)
      toast.error(error.response.data.error || 'Failed to toggle user status')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setDeleteUserId(userId)
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!deleteUserId) return
    try {
      const { data } = await client.delete(`/api/v1/auth/users/${deleteUserId}`)
      // Deleting your own account: the session no longer belongs to anyone,
      // so end it here rather than reloading a page you can't open.
      if (data?.self) {
        const { signOut } = await import('auth-astro/client')
        await signOut()
        return
      }
      await fetchUsers()
      setShowDeleteModal(false)
      setDeleteUserId(null)
      toast.success('Account deleted successfully')
    } catch (error:any) {
      console.error('Error deleting user:', error)
      toast.error(error.response?.data?.error || 'Failed to delete account')
    }
  }

    // Transfer user/admin to superadmin
    const handleTransferSuperadmin = async (userId: string) => {
      try {
        await client.post(`/api/v1/auth/transfer-superadmin/${userId}`)
        await fetchUsers()
        toast.success('Superadmin transferred successfully')
      } catch (error:any) {
        console.error('Error transferring superadmin:', error)
        toast.error(error.response.data.error || 'Failed to transfer superadmin')
      }
    }

  const openEditModal = (user: User) => {
    setEditingUser({ ...user })
    setShowEditModal(true)
  }

  const clearAllFilters = () => updateQueryParams({}, true)

  // Determine if Clear button should show
  const queryParams = new URLSearchParams(window.location.search)
  const pageParam = queryParams.get('page') || '1'
  const sizeParam = queryParams.get('size') || '10'
  const showClearButton =
    window.location.search &&
    (pageParam !== '1' ||
      sizeParam !== '10' ||
      queryParams.get('role') ||
      queryParams.get('provider') ||
      queryParams.get('active') ||
      queryParams.get('start') ||
      queryParams.get('end') ||
      queryParams.get('uOrder') ||
      queryParams.get('eOrder') ||
      queryParams.get('cOrder') ||
      queryParams.get('rOrder'))

    // Sorting handlers for table columns
    const handleSort = (key: 'uOrder' | 'eOrder' | 'cOrder' | 'rOrder') => {
      // Only one sort key active at a time
      const sortKeys = ['uOrder', 'eOrder', 'cOrder', 'rOrder']
      const currentOrder = currentFilter[key]
      let newOrder: 'asc' | 'desc' = 'desc'
      if (currentOrder === 'desc') newOrder = 'asc'
      // Build new params: set selected key, reset others
      const newParams: any = { page: '' }
      sortKeys.forEach(k => { newParams[k] = k === key ? newOrder : null })
      updateQueryParams(newParams)
    }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }
    const formatted = date.toLocaleString('en-US', options)
    // Transform format: "Thu, Nov 6, 2025, 1:00 PM EST" -> "Thu Nov 6, 2024 @ 1:00pm EST"
    return formatted
      .replace(/,\s+(\d+:\d+)/g, ' @ $1')  // Replace ", 1:00" with " @ 1:00"
      .replace(/,\s+/g, ' ')  // Remove remaining commas and extra spaces
      .replace(/(\d+):(\d+)\s+(AM|PM)/i, (match, hour, minute, period) => {
        return `${hour}:${minute}${period.toLowerCase()}`
      })
      .replace(/(\d+)\s+(\d{4})/, '$1, $2')  // Add comma between day and year
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
    return date.toLocaleString('en-US', options)
  }

  if (loading) return <div className="d-flex justify-content-center py-5">
    <div className="spinner" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme={theme === 'dark' ? 'dark' : 'light'} />
      {/* Header Section */}
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center gap-4 order-1 mb-5">
            <h4 className="fw-bold mb-0">Accounts ({meta.totalItems})</h4>
            {!isUser && (<a
              href="#"
              className="btn btn-outline-dark pe-3"
              onClick={(e) => {
                e.preventDefault()
                setShowAddModal(true)
              }}
            >
              <i className="bi bi-plus-lg btn-icon me-1"></i>New Account
            </a>)}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="row">
        <div className="col-md-12">
          <div className={`d-flex align-items-lg-center justify-content-md-end justify-content-between`}>
            <div className="small mb-1 d-md-none" style={{ marginLeft: 2 }}>
              <div className="d-flex justify-content-start align-items-center gap-1">
                <i className="bi bi-funnel" style={{ fontSize: 13 }}></i>
                <span>Filter(s)</span>
              </div>
            </div>
            {showClearButton && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn btn-link btn-clear p-0 d-flex align-items-center"
              >
                <i
                  className="bi bi-x-lg"
                  style={{ fontSize: 13, top: -2, right: 2, position: 'relative' }}
                ></i>
                <span className="small mb-1" style={{ marginRight: 2 }}>
                  Clear
                </span>
              </button>
            )}
          </div>

          <div className="d-lg-flex justify-content-lg-between align-items-lg-center gap-3 mx-0 mb-3">
            <div className="w-md-100 w-15 order-2 mb-4 mb-lg-0">
              <div className="d-lg-flex justify-content-lg-between align-items-lg-end gap-2 mx-0 mb-0">
                {/* Page size */}
                <select className="form-select select-filter-lg number-font mb-2 mb-lg-0" value={currentFilter.size?.toString() || '10'}
                        onChange={handleSizeChange}>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <div className="d-flex gap-2">
                  <select
                    className="form-select select-filter-lg"
                    value={currentFilter?.role || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      updateQueryParams({ role: value || '', page: '' })
                    }}
                  >
                    <option value="">All Roles</option>
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.name}</option>
                    ))}
                  </select>
                  <select
                    className="form-select select-filter-lg"
                    value={currentFilter?.provider || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      updateQueryParams({ provider: value || '', page: '' })
                    }}
                  >
                    <option value="">All Providers</option>
                    {providers.map(provider => (
                      <option key={provider.value} value={provider.value}>{provider.name}</option>
                    ))}
                  </select>
                </div>
              </div>    
            </div>
            {meta.totalItems > 0 ? (
              <div className="d-flex justify-content-start gap-4 mt-md-0 mt-4 mb-4 mb-md-0 order-1">
                <div className="small">
                  Showing <span className='fw-semibold'>{meta.fromPage}</span> to <span className='fw-semibold'>{meta.toPage}</span> of{' '}
                  <span className='fw-semibold'>{meta.totalItems}</span> accounts
                </div>
              </div>
            ) : (<div></div>)}
          </div>

          <CurrentFilter filter={currentFilter!} />
        </div>
      </div>

      {/* Users Table */}
      {meta.totalItems > 0 ? (
        <div className="card card-table">
          <div className="card-body table-responsive-lg">
            <table className="table table-striped mb-0" style={{ minWidth: 800 }}>
              <thead>
              <tr>
                <th>#</th>
                  <th style={{ minWidth: 120 }} className="d-none d-lg-table-cell">
                    <a href="#" className="d-flex justify-content-start align-items-center gap-1"
                       onClick={e => { e.preventDefault(); handleSort('uOrder') }}
                       style={{ cursor: 'pointer', textDecoration: 'none' }}>
                      <span className="fw-bold">Name</span>
                      <i className={`ms-1 bi bi-arrow-${currentFilter.uOrder === 'asc' ? 'up' : currentFilter.uOrder === 'desc' ? 'down' : 'down-up'}${currentFilter.uOrder ? '' : ' opacity-25'}`}></i>
                    </a>
                  </th>
                  <th>
                    <a href="#" className="d-flex justify-content-start align-items-center gap-1"
                       onClick={e => { e.preventDefault(); handleSort('eOrder') }}
                       style={{ cursor: 'pointer', textDecoration: 'none' }}>
                      <span className="fw-bold">Email</span>
                      <i className={`ms-1 bi bi-arrow-${currentFilter.eOrder === 'asc' ? 'up' : currentFilter.eOrder === 'desc' ? 'down' : 'down-up'}${currentFilter.eOrder ? '' : ' opacity-25'}`}></i>
                    </a>
                  </th>
                <th>
                  <a href="#" className="d-flex justify-content-start align-items-center gap-1"
                    onClick={e => { e.preventDefault(); handleSort('rOrder') }}
                    style={{ cursor: 'pointer', textDecoration: 'none' }}>
                    <span className="fw-bold">Role</span>
                    <i className={`ms-1 bi bi-arrow-${currentFilter.rOrder === 'asc' ? 'up' : currentFilter.rOrder === 'desc' ? 'down' : 'down-up'}${currentFilter.rOrder ? '' : ' opacity-25'}`}></i>
                  </a>
                </th>
                <th>Provider(s)</th>
                <th style={{minWidth: 100}}>
                  <a href="#" className="d-flex justify-content-start align-items-center gap-1"
                    onClick={e => { e.preventDefault(); handleSort('cOrder') }}
                    style={{ cursor: 'pointer', textDecoration: 'none' }}>
                    <span className="fw-bold">Created</span>
                    <i className={`ms-1 bi bi-arrow-${currentFilter.cOrder === 'asc' ? 'up' : currentFilter.cOrder === 'desc' ? 'down' : 'down-up'}${currentFilter.cOrder ? '' : ' opacity-25'}`}></i>
                  </a>
                </th>
                <th>Action(s)</th>
              </tr>
              </thead>
              <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className={user.email === email ? 'row-current-user' : undefined}
                  style={{ opacity: user.isActive ? 1 : 0.25 }}
                >
                  <td className={`small ${user.role === 'superadmin' ? 'fw-bold' : ''}`}>
                    {user.email === email ? 
                      (<>
                        <img
                          src={image || DEFAULT_AVATAR}
                          alt="Profile"
                          className="rounded-circle"
                          style={{ width: 26, height: 26, objectFit: 'cover' }}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = DEFAULT_AVATAR
                          }}
                        />
                      </>)
                      : (
                        <span className={`ms-1 ${user.role === 'superadmin' ? 'fw-bold' : ''}`}>{index + 1}</span>
                      )
                   }
                  </td>
                  <td className={`small d-none d-lg-table-cell ${user.role === 'superadmin' ? 'fw-bold' : ''}`}>{user.name}</td>
                  <td className={`small ${user.role === 'superadmin' ? 'fw-bold' : ''}`}>{user.email}</td> 
                  <td className={`small ${user.role === 'superadmin' ? 'fw-bold' : ''}`}>
                    {/* <select
                      className={`form-select form-select-sm ${user.role === 'superadmin' ? 'border-superadmin' : user.role === 'admin' ? 'border-admin' : ''}`}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'superadmin' | 'admin' | 'user')}
                      style={{ width: 'auto', minWidth: '120px' }}
                      disabled
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select> */}
                    <span className={`text-uppercase ${user.role === 'superadmin' ? 'fw-bold' : ''}`}>{user.role === 'superadmin' ? 'SuperAdmin' : user.role === 'admin' ? 'Admin' : 'User'}</span>
                  </td>
                  <td className={`small ${user.role === 'superadmin' ? 'fw-bold' : ''} ${user.role === 'superadmin' ? 'fw-bold' : ''}`}>
                    {/* {JSON.stringify(user,undefined,2)}<br />
                    {provider}
                    {email} */}
                    <div className={`d-flex flex-column flex-xl-row gap-1 ${user.email === email ? '' : 'opacity-25'}`}>
                      {user.providers.includes('google') && (
                        <span className={`badge badge-google d-flex align-items-center gap-1 ${provider === 'google' ? '' : 'opacity-25'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                            <path fill="currentColor"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Google
                        </span>
                      )}
                      {user.providers.includes('github') && (
                        <span className={`badge badge-github d-flex align-items-center gap-1 ${provider === 'github' ? '' : 'opacity-25'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                               fill="currentColor">
                            <path
                              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                          GitHub
                        </span>
                      )}
                      {user.providers.includes('linkedin') && (
                        <span className={`badge badge-linkedin d-flex align-items-center gap-1 ${provider === 'linkedin' ? '' : 'opacity-25'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                               fill="currentColor">
                            <path
                              d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn
                        </span>
                      )}
                      {user.providers.includes('microsoft') && (
                        <span className={`badge badge-microsoft d-flex align-items-center gap-1 ${provider === 'microsoft' ? '' : 'opacity-25'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M1 1h10v10H1z" />
                            <path fill="currentColor" d="M13 1h10v10H13z" />
                            <path fill="currentColor" d="M1 13h10v10H1z" />
                            <path fill="currentColor" d="M13 13h10v10H13z" />
                          </svg>
                          Microsoft
                        </span>
                      )}
                      {user.providers.includes('apple') && (
                        <span className={`badge badge-apple d-flex align-items-center gap-1 ${provider === 'apple' ? '' : 'opacity-25'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                               fill="currentColor">
                            <path
                              d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                          </svg>
                          Apple
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`small ${user.role === 'superadmin' ? 'fw-bold' : ''}`}>
                    <span className={`d-none d-lg-inline ${user.role === 'superadmin' ? 'fw-bold' : ''}`}>{formatDate(user.createdAt)}</span> 
                    <span className={`d-lg-none ${user.role === 'superadmin' ? 'fw-bold' : ''}`}>{formatDateShort(user.createdAt)}</span>
                  </td>
                  <td className={`small ${user.role === 'superadmin' ? 'fw-bold' : ''}`}> 
                    {/* Superadmin transfer icon */}
                    {(isSuperadmin && user.email !== email) ? (
                        <a
                          href="#"
                          className="ms-2"
                          onClick={e => {
                            e.preventDefault()
                            setShowAssignSuperAdminModal(true);
                            setAssignSuperAdminUserId(user.id);
                          }}
                          title="Assign as Superadmin"
                        >
                          <i className="bi bi-star text-dark"></i>
                        </a>
                    ) : (user.role === 'superadmin' ? <i className="ms-2 bi bi-star-fill text-dark"></i> : null)}
                    {/* ) : null} */}
                    {(!isUser && user.role !== 'superadmin') &&
                    <>
                      <a
                        href="#"
                        className="ms-2"
                        onClick={(e) => {
                          e.preventDefault()
                          handleToggleActive(user.id)
                        }}
                        title={user.isActive ? 'Lock account' : 'Unlock account'}
                      >
                        <i className={`bi bi-${user.isActive ? 'unlock' : 'lock'}`}></i>
                      </a>
                      <a
                        href="#"
                        className="ms-2"
                        onClick={(e) => {
                          e.preventDefault()
                          openEditModal(user)
                        }}
                        title="Edit account"
                      >
                        <i className="bi bi-pen"></i>
                      </a>
                      <a
                        href="#"
                        className="ms-2"
                        onClick={(e) => {
                          e.preventDefault()
                          handleDeleteUser(user.id)
                        }}
                        title={user.email === email ? 'Delete my account' : 'Delete account'}
                      >
                        <i className="bi bi-trash"></i>
                      </a>
                    </>
                    }
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="d-flex justify-content-center py-5">
          <p className="lead fw-light">No accounts found.</p>
        </div>
      )}

      {/* Pagination */}
      {meta.totalItems > 0 && (
        <div className="mt-4">
          <div className="small">
            Showing <span className='fw-semibold'>{meta.fromPage}</span> to <span className='fw-semibold'>{meta.toPage}</span> of{' '}
            <span className='fw-semibold'>{meta.totalItems}</span> accounts
          </div>
        </div>
      )}

      {meta.totalItems > 0 && meta.totalPages > 1 && (
        <>
          <div className="d-md-block d-none my-5">
            <Pagination theme="default" filterMeta={meta} />
          </div>
          <div className="d-md-none my-5">
            <Pagination theme="dropdown" filterMeta={meta} />
          </div>
        </>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
              <div className="modal-content">
                <div className="modal-header d-flex justify-content-between align-items-center">
                  <h1 className="modal-title fs-5 fw-bold mb-0">New Account</h1>
                  <a
                    href="#"
                    className="bi bi-x-lg h4 mb-0"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowAddModal(false)
                    }}
                  ></a>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="userName" className="form-label mb-0">Full Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="userName"
                      placeholder="Enter full name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="userEmail" className="form-label mb-0">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="userEmail"
                      placeholder="user@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="userRole" className="form-label mb-0">Role</label>
                    <select
                      className="form-select form-select-lg"
                      id="userRole"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'superadmin' | 'admin' | 'user' })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label mb-0 d-block">Authentication Providers</label>
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="provider-google"
                          checked={newUser.providers.includes('google')}
                          onChange={() => handleProviderToggle('google', true)}
                        />
                        <label className="form-check-label ps-1 me-3" htmlFor="provider-google">
                          Google
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="provider-github"
                          checked={newUser.providers.includes('github')}
                          onChange={() => handleProviderToggle('github', true)}
                        />
                        <label className="form-check-label ps-1 me-3" htmlFor="provider-github">
                          GitHub
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="provider-linkedin"
                          checked={newUser.providers.includes('linkedin')}
                          onChange={() => handleProviderToggle('linkedin', true)}
                        />
                        <label className="form-check-label ps-1 me-3" htmlFor="provider-linkedin">
                          LinkedIn
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="provider-microsoft"
                          checked={newUser.providers.includes('microsoft')}
                          onChange={() => handleProviderToggle('microsoft', true)}
                        />
                        <label className="form-check-label ps-1 me-3" htmlFor="provider-microsoft">
                          Microsoft
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="provider-apple"
                          checked={newUser.providers.includes('apple')}
                          onChange={() => handleProviderToggle('apple', true)}
                        />
                        <label className="form-check-label ps-1 me-3" htmlFor="provider-apple">
                          Apple
                        </label>
                      </div>
                    </div>
                    {newUser.providers.length === 0 && (
                      <small className="text-danger">At least one provider must be selected</small>
                    )}
                  </div>
                </div>
                <div className="modal-footer d-flex justify-content-start gap-1 m-0">
                  <button
                    type="button"
                    className="btn btn-lg btn-modal fw-light m-0"
                    onClick={handleAddUser}
                    disabled={!newUser.email || !newUser.name || newUser.providers.length === 0}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="btn btn-lg btn-transparent fw-light m-0"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
              <div className="modal-content h-100">
                <div className="modal-header d-flex justify-content-between align-items-center">
                  <h1 className="modal-title fs-5 fw-bold mb-0">Edit Account</h1>
                  <a
                    href="#"
                    className="bi bi-x-lg h4 mb-0"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowEditModal(false)
                    }}
                  ></a>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="editUserName" className="form-label mb-0">Full Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="editUserName"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editUserEmail" className="form-label mb-0">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="editUserEmail"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editUserRole" className="form-label mb-0">Role</label>
                    <select
                      className="form-select form-select-lg"
                      id="editUserRole"
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'superadmin' | 'admin' | 'user' })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label mb-0 d-block">Authentication Providers</label>
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="edit-provider-google"
                          checked={editingUser.providers.includes('google')}
                          onChange={() => handleProviderToggle('google', false)}
                        />
                        <label className="form-check-label ps-1 me-3" htmlFor="edit-provider-google">
                          Google
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="edit-provider-github"
                          checked={editingUser.providers.includes('github')}
                          onChange={() => handleProviderToggle('github', false)}
                        />
                        <label className="form-check-label ps-1 me-3" htmlFor="edit-provider-github">
                          GitHub
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="edit-provider-linkedin"
                          checked={editingUser.providers.includes('linkedin')}
                          onChange={() => handleProviderToggle('linkedin', false)}
                        />
                        <label className="form-check-label ps-1 me-3" htmlFor="edit-provider-linkedin">
                          LinkedIn
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="edit-provider-microsoft"
                          checked={editingUser.providers.includes('microsoft')}
                          onChange={() => handleProviderToggle('microsoft', false)}
                        />
                        <label className="form-check-label ps-1 me-3" htmlFor="edit-provider-microsoft">
                          Microsoft
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="edit-provider-apple"
                          checked={editingUser.providers.includes('apple')}
                          onChange={() => handleProviderToggle('apple', false)}
                        />
                        <label className="form-check-label ps-1 me-3" htmlFor="edit-provider-apple">
                          Apple
                        </label>
                      </div>
                    </div>
                    {editingUser.providers.length === 0 && (
                      <small className="text-danger">At least one provider must be selected</small>
                    )}
                  </div>
                </div>
                <div className="modal-footer d-flex justify-content-start gap-1 m-0">
                  <button
                    type="button"
                    className="btn btn-lg btn-modal fw-light m-0"
                    onClick={handleEditUser}
                    disabled={!editingUser.email || !editingUser.name || editingUser.providers.length === 0}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-lg btn-transparent fw-light m-0"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="modal modal-alert fade show" id="deleteUserModal" tabIndex={-1} aria-modal="true" role="dialog" style={{ display: 'block' }}>
            <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
              <div className="modal-content">
                <div className="modal-header d-flex justify-content-between align-items-center">
                  <h1 className="modal-title fs-5 fw-bold mb-0">Delete Account</h1>
                  <a href="#" className="bi bi-x-lg h4 mb-0" onClick={e => {e.preventDefault(); setShowDeleteModal(false); setDeleteUserId(null)}}></a>
                </div>
                <div className="modal-body">
                  <p className="lead">Are you sure you want to delete this account?</p>
                  {users.find(u => u.id === deleteUserId)?.email === email && (
                    <p className="small mb-0">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      This is your own account: deleting it signs you out.
                    </p>
                  )}
                </div>
                <div className="modal-footer">
                  <div className="d-flex justify-content-start gap-1 m-0">
                    <button type="button" className="btn btn-lg btn-modal btn-danger fw-light" onClick={confirmDeleteUser}>Confirm</button>
                    <button type="button" className="btn btn-lg btn-transparent fw-light" onClick={() => {setShowDeleteModal(false); setDeleteUserId(null)}}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Assign Superadmin Confirmation Modal */}
      {showAssignSuperAdminModal && (
        <>
          <div className="modal modal-alert fade show" id="assignSuperAdminModal" tabIndex={-1} aria-modal="true" role="dialog" style={{ display: 'block' }}>
            <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
              <div className="modal-content">
                <div className="modal-header d-flex justify-content-between align-items-center">
                  <h1 className="modal-title fs-5 fw-bold mb-0">Assign Superadmin</h1>
                  <a href="#" className="bi bi-x-lg h4 mb-0" onClick={e => {e.preventDefault(); setShowAssignSuperAdminModal(false); setAssignSuperAdminUserId(null)}}></a>
                </div>
                <div className="modal-body">
                  <p className="lead">Are you sure you want to make this account Superadmin?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-lg btn-modal btn-danger fw-light" onClick={confirmAssignSuperAdmin}>Confirm</button>
                  <button type="button" className="btn btn-lg btn-transparent fw-light" onClick={() => {setShowAssignSuperAdminModal(false); setAssignSuperAdminUserId(null)}}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  )
}

export default UserManagement
